// Creating an Intl formatter is far slower than using one, and the pipes run on every change
// detection, so each locale + options combination is created once and reused.
const numberFormats: Map<string, Intl.NumberFormat> = new Map<string, Intl.NumberFormat>();
const dateFormats: Map<string, Intl.DateTimeFormat> = new Map<string, Intl.DateTimeFormat>();
const relativeFormats: Map<string, Intl.RelativeTimeFormat> = new Map<
  string,
  Intl.RelativeTimeFormat
>();

function cacheKey(locale: string, options: object | undefined): string {
  return `${locale}|${JSON.stringify(options ?? {})}`;
}

function cached<T>(cache: Map<string, T>, key: string, create: () => T): T {
  let format: T | undefined = cache.get(key);

  if (format === undefined) {
    format = create();
    cache.set(key, format);
  }

  return format;
}

export function getNumberFormat(
  locale: string,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return cached(
    numberFormats,
    cacheKey(locale, options),
    () => new Intl.NumberFormat(locale, options),
  );
}

export function getDateFormat(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return cached(
    dateFormats,
    cacheKey(locale, options),
    () => new Intl.DateTimeFormat(locale, options),
  );
}

export function getRelativeTimeFormat(
  locale: string,
  options?: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat {
  return cached(
    relativeFormats,
    cacheKey(locale, options),
    () => new Intl.RelativeTimeFormat(locale, options),
  );
}
