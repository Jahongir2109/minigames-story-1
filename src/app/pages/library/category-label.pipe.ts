import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageStore } from '@/core/i18n/language.store';

/**
 * The name of a category in the language of the UI (`puzzle` -> "Boshqotirma"). A category that
 * the app does not know yet keeps the English label of the API, or its slug.
 */
@Pipe({ name: 'categoryLabel', pure: false })
export class CategoryLabelPipe implements PipeTransform {
  private readonly languages: LanguageStore = inject(LanguageStore);
  private readonly transloco: TranslocoService = inject(TranslocoService);

  transform(slug: string, fallback?: string): string {
    // Read the language, so the label follows a switch.
    this.languages.language();

    const key: string = `categories.${slug}`;
    const label: string = this.transloco.translate(key);

    return label === key ? (fallback ?? slug) : label;
  }
}
