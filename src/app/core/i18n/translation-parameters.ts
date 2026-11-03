/**
 * Values of the ICU placeholders of a message, e.g. `{ count: 3 }` for `{count, plural, ...}`.
 */
export type TranslationParameters = Readonly<Record<string, string | number | boolean>>;
