import type { EnvironmentProviders, Provider } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { type Translation, TranslocoTestingModule } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

import { DEFAULT_LANGUAGE, type Language, LANGUAGES } from '@/core/i18n/languages';

import en from '../../public/i18n/en.json';
import ru from '../../public/i18n/ru.json';
import uz from '../../public/i18n/uz.json';

export const TRANSLATIONS: Readonly<Record<Language, Translation>> = { en, uz, ru };

/**
 * Real translations without HTTP: components are tested with the texts users see.
 */
export function provideTestI18n(
  language: Language = DEFAULT_LANGUAGE,
): (Provider | EnvironmentProviders)[] {
  return [
    importProvidersFrom(
      TranslocoTestingModule.forRoot({
        langs: { ...TRANSLATIONS },
        translocoConfig: {
          availableLangs: [...LANGUAGES],
          defaultLang: language,
          fallbackLang: DEFAULT_LANGUAGE,
          reRenderOnLangChange: true,
          missingHandler: { useFallbackTranslation: true, logMissingKey: false },
        },
        preloadLangs: true,
      }),
    ),
    provideTranslocoMessageformat(),
  ];
}

/**
 * An in-memory Storage, so every test starts without saved data.
 */
export class MemoryStorage implements Storage {
  private readonly items: Map<string, string> = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    let position: number = 0;

    for (const key of this.items.keys()) {
      if (position === index) {
        return key;
      }

      position += 1;
    }

    return null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}
