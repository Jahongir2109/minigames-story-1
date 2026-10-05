import { describe, expect, it } from 'vitest';

import { formatCount, formatRating, formatRelativeTime, formatScore } from './format';

describe('formatCount', () => {
  it('keeps values below a thousand as they are', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(950)).toBe('950');
  });

  it('shortens thousands to one decimal without rounding up', () => {
    expect(formatCount(1000)).toBe('1.0K');
    expect(formatCount(54_200)).toBe('54.2K');
    expect(formatCount(28_750)).toBe('28.7K');
  });
});

describe('formatRating', () => {
  it('always shows one decimal', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(4.86)).toBe('4.9');
  });
});

describe('formatScore', () => {
  it('groups thousands with commas', () => {
    expect(formatScore(356_700)).toBe('356,700');
    expect(formatScore(42)).toBe('42');
  });
});

describe('formatRelativeTime', () => {
  const now: Date = new Date('2026-10-05T12:00:00.000Z');

  function ago(seconds: number): string {
    return new Date(now.getTime() - seconds * 1000).toISOString();
  }

  it('treats the last minute, future dates and invalid dates as now', () => {
    expect(formatRelativeTime(ago(59), now)).toBe('just now');
    expect(formatRelativeTime(ago(-600), now)).toBe('just now');
    expect(formatRelativeTime('not a date', now)).toBe('just now');
  });

  it('counts minutes and hours', () => {
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5 min ago');
    expect(formatRelativeTime(ago(3600), now)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(2 * 3600), now)).toBe('2 hours ago');
  });

  it('counts days, weeks, months and years', () => {
    const day: number = 24 * 3600;

    expect(formatRelativeTime(ago(day), now)).toBe('1 day ago');
    expect(formatRelativeTime(ago(3 * day), now)).toBe('3 days ago');
    expect(formatRelativeTime(ago(7 * day), now)).toBe('1 week ago');
    expect(formatRelativeTime(ago(29 * day), now)).toBe('3 weeks ago');
    expect(formatRelativeTime(ago(4 * 30 * day), now)).toBe('4 months ago');
    expect(formatRelativeTime(ago(364 * day), now)).toBe('11 months ago');
    expect(formatRelativeTime(ago(2 * 365 * day), now)).toBe('2 years ago');
  });
});
