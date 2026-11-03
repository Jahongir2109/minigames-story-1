import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import type { Observable } from 'rxjs';

/**
 * Loads one language file from `public/i18n` when it is needed for the first time; Transloco
 * keeps it in memory afterwards, so switching back is instant. The path is relative, so it
 * follows `<base href>` when the app is served from a sub-folder.
 */
@Injectable({ providedIn: 'root' })
export class TranslationLoader implements TranslocoLoader {
  private readonly http: HttpClient = inject(HttpClient);

  getTranslation(language: string): Observable<Translation> {
    return this.http.get<Translation>(`i18n/${language}.json`);
  }
}
