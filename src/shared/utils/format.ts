const THOUSAND: number = 1000;
const HUNDRED: number = 100;

/**
 * Compact counters used in the design: 54200 -> "54.2K", 28750 -> "28.7K", 950 -> "950".
 */
export function formatCount(value: number): string {
  if (value < THOUSAND) {
    return String(value);
  }

  const thousands: number = Math.floor(value / HUNDRED) / (THOUSAND / HUNDRED);

  return `${thousands.toFixed(1)}K`;
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

/**
 * Scores of the records table: 356700 -> "356,700".
 */
export function formatScore(value: number): string {
  return value.toLocaleString('en-US');
}

const MINUTE: number = 60;
const HOUR: number = 60 * MINUTE;
const DAY: number = 24 * HOUR;

// Units of the relative dates with their length in seconds, largest first.
const RELATIVE_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * DAY],
  ['month', 30 * DAY],
  ['week', 7 * DAY],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

const relativeTimeFormat: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
});

/**
 * Dates of records and comments relative to now: "2 days ago", "last week".
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const seconds: number = (new Date(isoDate).getTime() - now.getTime()) / THOUSAND;

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTimeFormat.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return 'just now';
}
