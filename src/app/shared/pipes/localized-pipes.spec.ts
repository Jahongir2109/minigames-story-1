import { TestBed } from '@angular/core/testing';

import { LanguageStore } from '@/core/i18n/language.store';
import { STORAGE } from '@/core/storage/storage';

import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { LocalizedDatePipe } from './localized-date.pipe';
import { LocalizedNumberPipe } from './localized-number.pipe';

function setup(): { store: LanguageStore; number: LocalizedNumberPipe; date: LocalizedDatePipe } {
  TestBed.configureTestingModule({
    providers: [
      provideTestI18n(),
      { provide: STORAGE, useValue: new MemoryStorage() },
      LocalizedNumberPipe,
      LocalizedDatePipe,
    ],
  });

  return {
    store: TestBed.inject(LanguageStore),
    number: TestBed.inject(LocalizedNumberPipe),
    date: TestBed.inject(LocalizedDatePipe),
  };
}

describe('localized pipes', () => {
  it('format numbers for the active language', async () => {
    const { store, number } = setup();

    expect(number.transform(12_345.5)).toBe('12,345.5');

    await store.use('ru');

    expect(number.transform(12_345.5)).toBe('12 345,5');
  });

  it('format dates for the active language', async () => {
    const { store, date } = setup();
    const value: string = '2026-03-05T12:00:00Z';

    expect(date.transform(value)).toBe('Mar 5, 2026');

    await store.use('ru');

    expect(date.transform(value)).toContain('2026');
    expect(date.transform(value)).toContain('мар');
  });

  it('give an empty string for missing or invalid values', () => {
    const { number, date } = setup();

    expect(number.transform(null)).toBe('');
    expect(number.transform(NaN)).toBe('');
    expect(date.transform('')).toBe('');
    expect(date.transform(undefined)).toBe('');
    expect(date.transform('not a date')).toBe('');
  });
});
