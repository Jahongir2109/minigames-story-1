import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';

import { LanguageStore } from './language.store';
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages';
import { TranslatedTitleStrategy } from './translated-title.strategy';
import { TranslationLoader } from './translation-loader';

/**
 * Runtime i18n: the language can be switched at any moment without a reload. Messages use the
 * ICU syntax (plural, select) through the MessageFormat transpiler. Needs HttpClient.
 */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        fallbackLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          // A missing key is shown in English rather than as a raw key.
          useFallbackTranslation: true,
          logMissingKey: isDevMode(),
        },
      },
      loader: TranslationLoader,
    }),
    provideTranslocoMessageformat(),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideAppInitializer(() => inject(LanguageStore).init()),
  ]);
}
