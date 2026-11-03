import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageStore } from '@/core/i18n/language.store';
import { STORAGE } from '@/core/storage/storage';

import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { formatCount, formatRating, getRelativeTime } from './format';
import { CompactCountPipe, RatingPipe, RelativeTimePipe } from './format.pipes';

const NOW: Date = new Date('2026-09-01T12:00:00Z');

function ago(seconds: number): string {
  return new Date(NOW.getTime() - seconds * 1000).toISOString();
}

describe('formatCount', () => {
  it('writes large counters in the compact form of the design', () => {
    expect(formatCount(950, 'en-US')).toBe('950');
    expect(formatCount(1000, 'en-US')).toBe('1.0K');
    expect(formatCount(54_200, 'en-US')).toBe('54.2K');
    expect(formatCount(28_750, 'en-US')).toBe('28.7K');
    expect(formatCount(2_590_000, 'en-US')).toBe('2.5M');
  });

  it('uses the separator and the suffix of the language', () => {
    expect(formatCount(54_200, 'ru-RU')).toBe('54,2 тыс.');
    expect(formatCount(54_200, 'uz-Latn-UZ')).toContain('54,2');
  });
});

describe('formatRating', () => {
  it('always shows one decimal', () => {
    expect(formatRating(5, 'en-US')).toBe('5.0');
    expect(formatRating(4.85, 'en-US')).toBe('4.9');
    expect(formatRating(4.8, 'ru-RU')).toBe('4,8');
  });
});

describe('getRelativeTime', () => {
  it('picks the largest whole unit', () => {
    expect(getRelativeTime(ago(30), NOW)).toBeUndefined();
    expect(getRelativeTime(ago(5 * 60), NOW)).toEqual({ value: 5, unit: 'minute' });
    expect(getRelativeTime(ago(2 * 3600), NOW)).toEqual({ value: 2, unit: 'hour' });
    expect(getRelativeTime(ago(3 * 86_400), NOW)).toEqual({ value: 3, unit: 'day' });
    expect(getRelativeTime(ago(8 * 86_400), NOW)).toEqual({ value: 1, unit: 'week' });
    expect(getRelativeTime(ago(29 * 86_400), NOW)).toEqual({ value: 3, unit: 'week' });
    expect(getRelativeTime(ago(130 * 86_400), NOW)).toEqual({ value: 4, unit: 'month' });
    expect(getRelativeTime(ago(800 * 86_400), NOW)).toEqual({ value: 2, unit: 'year' });
  });

  it('treats future and invalid dates as now', () => {
    expect(getRelativeTime(ago(-600), NOW)).toBeUndefined();
    expect(getRelativeTime('not a date', NOW)).toBeUndefined();
  });
});

@Component({
  imports: [CompactCountPipe, RatingPipe, RelativeTimePipe],
  template: `<span>{{ 54200 | compactCount }}</span
    ><span>{{ 4.8 | rating }}</span
    ><span>{{ fresh | relativeTime }}</span
    ><span>{{ old | relativeTime }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly fresh: string = new Date().toISOString();
  readonly old: string = new Date(Date.now() - 2 * 3_600_000).toISOString();
}

describe('format pipes', () => {
  it('follow the language of the UI', async () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTestI18n(), { provide: STORAGE, useValue: new MemoryStorage() }],
    });

    const fixture: ComponentFixture<Host> = TestBed.createComponent(Host);
    const texts = (): string[] =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('span')].map(
        (span: HTMLSpanElement) => span.textContent,
      );

    await fixture.whenStable();

    expect(texts()).toEqual(['54.2K', '4.8', 'just now', '2 hours ago']);

    await TestBed.inject(LanguageStore).use('ru');
    await fixture.whenStable();

    expect(texts()).toEqual(['54,2 тыс.', '4,8', 'только что', '2 часа назад']);
  });
});
