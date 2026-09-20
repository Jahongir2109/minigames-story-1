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
