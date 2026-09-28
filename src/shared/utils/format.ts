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

const SECOND_MS: number = 1000;
const MINUTE: number = 60;
const HOUR: number = 60 * MINUTE;
const DAY: number = 24 * HOUR;
const DAYS_IN_WEEK: number = 7;
const DAYS_IN_MONTH: number = 30;
const DAYS_IN_YEAR: number = 365;
const MAX_WEEKS: number = 3;
const MAX_MONTHS: number = 11;

function pluralize(count: number, unit: string): string {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'} ago`;
}

/**
 * Dates of records and comments relative to now: "just now", "5 min ago", "2 hours ago",
 * "3 days ago", "1 week ago", "4 months ago", "2 years ago". Dates in the future count as now.
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const seconds: number = Math.floor((now.getTime() - new Date(isoDate).getTime()) / SECOND_MS);

  if (Number.isNaN(seconds) || seconds < MINUTE) {
    return 'just now';
  }

  if (seconds < HOUR) {
    return `${String(Math.floor(seconds / MINUTE))} min ago`;
  }

  if (seconds < DAY) {
    return pluralize(Math.floor(seconds / HOUR), 'hour');
  }

  const days: number = Math.floor(seconds / DAY);

  if (days < DAYS_IN_WEEK) {
    return pluralize(days, 'day');
  }

  if (days < DAYS_IN_MONTH) {
    return pluralize(Math.min(Math.floor(days / DAYS_IN_WEEK), MAX_WEEKS), 'week');
  }

  return days < DAYS_IN_YEAR
    ? pluralize(Math.min(Math.floor(days / DAYS_IN_MONTH), MAX_MONTHS), 'month')
    : pluralize(Math.floor(days / DAYS_IN_YEAR), 'year');
}
