import { getNumberFormat } from '@/core/i18n/intl-formats';

const THOUSAND: number = 1000;
const MILLION: number = 1_000_000;

const ONE_DECIMAL: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

const COMPACT: Intl.NumberFormatOptions = {
  notation: 'compact',
  ...ONE_DECIMAL,
};

/**
 * Ratings always show one decimal: 4.8, 5.0 (`4,8` in Uzbek and Russian).
 */
export function formatRating(value: number, locale: string): string {
  return getNumberFormat(locale, ONE_DECIMAL).format(value);
}

/**
 * Compact counters used in the design: 54200 -> "54.2K", 950 -> "950". The value is cut, not
 * rounded (28750 -> "28.7K"), so a counter never claims more than it has; the suffix follows
 * the language ("54,2 тыс.", "54,2 ming").
 */
export function formatCount(value: number, locale: string): string {
  if (value < THOUSAND) {
    return getNumberFormat(locale).format(value);
  }

  const step: number = (value < MILLION ? THOUSAND : MILLION) / 10;

  return getNumberFormat(locale, COMPACT).format(Math.floor(value / step) * step);
}

const SECOND_MS: number = 1000;
const MINUTE: number = 60;
const HOUR: number = 60 * MINUTE;
const DAY: number = 24 * HOUR;
const DAYS_IN_WEEK: number = 7;
const DAYS_IN_MONTH: number = 30;
const DAYS_IN_YEAR: number = 365;
const MAX_WEEKS: number = 3;
const MAX_MONTHS: number = 11;

export interface RelativeTime {
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
}

/**
 * How long ago a date was, in the largest whole unit: 5 minutes, 2 hours, 3 days, 1 week,
 * 4 months, 2 years. `undefined` for less than a minute ago, dates in the future and invalid
 * dates ("just now").
 */
export function getRelativeTime(isoDate: string, now: Date = new Date()): RelativeTime | undefined {
  const seconds: number = Math.floor((now.getTime() - new Date(isoDate).getTime()) / SECOND_MS);

  if (Number.isNaN(seconds) || seconds < MINUTE) {
    return undefined;
  }

  if (seconds < HOUR) {
    return { value: Math.floor(seconds / MINUTE), unit: 'minute' };
  }

  if (seconds < DAY) {
    return { value: Math.floor(seconds / HOUR), unit: 'hour' };
  }

  const days: number = Math.floor(seconds / DAY);

  if (days < DAYS_IN_WEEK) {
    return { value: days, unit: 'day' };
  }

  if (days < DAYS_IN_MONTH) {
    return { value: Math.min(Math.floor(days / DAYS_IN_WEEK), MAX_WEEKS), unit: 'week' };
  }

  return days < DAYS_IN_YEAR
    ? { value: Math.min(Math.floor(days / DAYS_IN_MONTH), MAX_MONTHS), unit: 'month' }
    : { value: Math.floor(days / DAYS_IN_YEAR), unit: 'year' };
}
