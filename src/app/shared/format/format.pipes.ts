import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { getRelativeTimeFormat } from '@/core/i18n/intl-formats';
import { LanguageStore } from '@/core/i18n/language.store';

import { formatCount, formatRating, getRelativeTime, type RelativeTime } from './format';

// The pipes are impure on purpose: they read the language signal, so the numbers and dates
// follow a language switch; the Intl formatters behind them are cached.

/**
 * `4.8` -> "4.8" / "4,8".
 */
@Pipe({ name: 'rating', pure: false })
export class RatingPipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);

  transform(value: number): string {
    return formatRating(value, this.languages.locale());
  }
}

/**
 * `54200` -> "54.2K" / "54,2 тыс." / "54,2 ming".
 */
@Pipe({ name: 'compactCount', pure: false })
export class CompactCountPipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);

  transform(value: number): string {
    return formatCount(value, this.languages.locale());
  }
}

/**
 * An ISO date -> "5 minutes ago" / "5 минут назад" / "5 daqiqa oldin", or "just now".
 */
@Pipe({ name: 'relativeTime', pure: false })
export class RelativeTimePipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);
  private readonly transloco: TranslocoService = inject(TranslocoService);

  transform(isoDate: string): string {
    const time: RelativeTime | undefined = getRelativeTime(isoDate);

    if (time === undefined) {
      // Read the language, so the text follows a switch like the Intl ones.
      this.languages.language();

      return this.transloco.translate('time.justNow');
    }

    return getRelativeTimeFormat(this.languages.locale(), { numeric: 'always' }).format(
      -time.value,
      time.unit,
    );
  }
}
