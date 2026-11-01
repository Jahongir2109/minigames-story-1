import { DOCUMENT } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  type Signal,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { STORAGE } from '@/core/storage/storage';

import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  isLanguage,
  type Language,
  LANGUAGE_LOCALES,
} from './languages';

export const LANGUAGE_STORAGE_KEY: string = 'minigames:jahongir2109-minigames:language';

/**
 * The single source of truth for the UI language. It chooses the language on startup (saved
 * choice -> browser preference -> English), keeps Transloco, `<html lang>` and the saved choice
 * in sync, and exposes the `Intl` locale for numbers and dates.
 */
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly transloco: TranslocoService = inject(TranslocoService);
  private readonly document: Document = inject(DOCUMENT);
  private readonly storage: Storage = inject(STORAGE);
  private readonly current: WritableSignal<Language> = signal(DEFAULT_LANGUAGE);

  readonly language: Signal<Language> = this.current.asReadonly();
  readonly locale: Signal<string> = computed(() => LANGUAGE_LOCALES[this.current()]);

  private initialLanguage(): Language {
    const saved: string | null = this.read();

    if (isLanguage(saved)) {
      return saved;
    }

    const browser: readonly string[] = this.document.defaultView?.navigator.languages ?? [];

    return detectLanguage(browser) ?? DEFAULT_LANGUAGE;
  }

  // Storage can be unavailable (private mode, blocked cookies); the language then lasts only
  // until the page is closed.
  private read(): string | null {
    try {
      return this.storage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private save(language: Language): void {
    try {
      this.storage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // See read().
    }
  }

  /**
   * Chooses the startup language and waits for its translations, so the first render is
   * already translated (used by the app initializer).
   */
  async init(): Promise<void> {
    await this.use(this.initialLanguage(), { persist: false });
  }

  /**
   * Switches the whole UI to another language without reloading the page.
   */
  async use(language: Language, options: { persist?: boolean } = {}): Promise<void> {
    // The file is loaded first, so the UI never shows the keys of a language that is not ready.
    await firstValueFrom(this.transloco.load(language));
    this.transloco.setActiveLang(language);
    this.current.set(language);
    this.document.documentElement.lang = language;

    if (options.persist ?? true) {
      this.save(language);
    }
  }
}
