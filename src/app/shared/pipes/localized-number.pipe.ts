import { inject, Pipe, type PipeTransform } from '@angular/core';

import { getNumberFormat } from '@/core/i18n/intl-formats';
import { LanguageStore } from '@/core/i18n/language.store';

/**
 * Formats a number for the active language (`12,345` / `12 345`). Impure on purpose: it reads
 * the language signal, so the template is updated when the language changes. The formatter
 * itself is cached, so a run costs only the formatting.
 */
@Pipe({ name: 'localizedNumber', pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);

  transform(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
    const number: number = value ?? NaN;

    return Number.isNaN(number)
      ? ''
      : getNumberFormat(this.languages.locale(), options).format(number);
  }
}
