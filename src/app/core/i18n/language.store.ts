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
  // Every switch gets a number; only the latest one may apply its language.
  private lastRequest: number = 0;

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

  private apply(language: Language): void {
    this.transloco.setActiveLang(language);
    this.current.set(language);
    this.document.documentElement.lang = language;
  }

  /**
   * Chooses the startup language and waits for its translations, so the first render is
   * already translated (used by the app initializer). It never rejects: when the file of the
   * chosen language cannot be loaded, the app starts in English, and when even that fails, it
   * still starts (Transloco shows the keys) instead of leaving a blank page.
   */
  async init(): Promise<void> {
    const language: Language = this.initialLanguage();

    try {
      await this.use(language, { persist: false });
    } catch {
      if (language === DEFAULT_LANGUAGE) {
        this.apply(DEFAULT_LANGUAGE);
        return;
      }

      try {
        await this.use(DEFAULT_LANGUAGE, { persist: false });
      } catch {
        this.apply(DEFAULT_LANGUAGE);
      }
    }
  }

  /**
   * Switches the whole UI to another language without reloading the page. When the user picks
   * several languages quickly, only the last pick is applied, whatever order the files arrive in.
   * Rejects when the file cannot be loaded; the current language stays then.
   */
  async use(language: Language, options: { persist?: boolean } = {}): Promise<void> {
    this.lastRequest += 1;

    const request: number = this.lastRequest;

    // The file is loaded first, so the UI never shows the keys of a language that is not ready.
    await firstValueFrom(this.transloco.load(language));

    // When the file fails, Transloco quietly loads the fallback language instead; the switch is
    // reported as failed then, so the UI never claims a language it does not show.
    if (Object.keys(this.transloco.getTranslation(language)).length === 0) {
      throw new Error(`The "${language}" translations could not be loaded.`);
    }

    if (request !== this.lastRequest) {
      return;
    }

    this.apply(language);

    if (options.persist ?? true) {
      this.save(language);
    }
  }
}
