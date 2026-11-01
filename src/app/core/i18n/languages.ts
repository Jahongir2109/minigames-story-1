export type Language = 'en' | 'uz' | 'ru';

export const LANGUAGES: readonly Language[] = ['en', 'uz', 'ru'];

export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Locale used by `Intl` (numbers, dates) for each language.
 */
export const LANGUAGE_LOCALES: Readonly<Record<Language, string>> = {
  en: 'en-US',
  uz: 'uz-Latn-UZ',
  ru: 'ru-RU',
};

/**
 * Each language is named in itself, so a user who cannot read the current UI still finds theirs.
 */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  en: 'English',
  uz: 'Oʻzbekcha',
  ru: 'Русский',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly unknown[]).includes(value);
}

/**
 * Picks the first supported language from the browser preferences (`uz-UZ` -> `uz`).
 */
export function detectLanguage(preferences: readonly string[]): Language | undefined {
  for (const preference of preferences) {
    const base: string = preference.toLowerCase().split('-', 1)[0] ?? '';

    if (isLanguage(base)) {
      return base;
    }
  }

  return undefined;
}
