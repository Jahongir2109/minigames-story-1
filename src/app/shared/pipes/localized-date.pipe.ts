import { inject, Pipe, type PipeTransform } from '@angular/core';

import { getDateFormat } from '@/core/i18n/intl-formats';
import { LanguageStore } from '@/core/i18n/language.store';

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
};

/**
 * Formats a date (ISO string, timestamp or Date) for the active language. An invalid value
 * gives an empty string instead of "Invalid Date".
 */
@Pipe({ name: 'localizedDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);

  transform(
    value: string | number | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS,
  ): string {
    // A missing value becomes an invalid date, which is handled below.
    const date: Date = new Date(value ?? NaN);

    return Number.isNaN(date.getTime())
      ? ''
      : getDateFormat(this.languages.locale(), options).format(date);
  }
}
