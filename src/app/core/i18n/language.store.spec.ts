import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  provideTransloco,
  type Translation,
  type TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { type Observable, of, throwError } from 'rxjs';

import { STORAGE } from '@/core/storage/storage';

import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { LANGUAGE_STORAGE_KEY, LanguageStore } from './language.store';
import { LANGUAGES } from './languages';

function setup(options: { saved?: string; browser?: readonly string[] } = {}): {
  store: LanguageStore;
  storage: MemoryStorage;
  transloco: TranslocoService;
  document: Document;
} {
  const storage: MemoryStorage = new MemoryStorage();

  if (options.saved !== undefined) {
    storage.setItem(LANGUAGE_STORAGE_KEY, options.saved);
  }

  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(options.browser ?? []);

  TestBed.configureTestingModule({
    providers: [provideTestI18n(), { provide: STORAGE, useValue: storage }],
  });

  return {
    store: TestBed.inject(LanguageStore),
    storage,
    transloco: TestBed.inject(TranslocoService),
    document: TestBed.inject(DOCUMENT),
  };
}

describe('LanguageStore', () => {
  it('starts with the saved language', async () => {
    const { store, transloco } = setup({ saved: 'ru', browser: ['uz'] });

    await store.init();

    expect(store.language()).toBe('ru');
    expect(transloco.getActiveLang()).toBe('ru');
  });

  it('falls back to the browser language, then to English', async () => {
    const first: ReturnType<typeof setup> = setup({ saved: 'xx', browser: ['de', 'uz-UZ'] });
    await first.store.init();

    expect(first.store.language()).toBe('uz');

    TestBed.resetTestingModule();
    const second: ReturnType<typeof setup> = setup({ browser: ['de'] });
    await second.store.init();

    expect(second.store.language()).toBe('en');
  });

  it('does not save the detected language until the user picks one', async () => {
    const { store, storage } = setup({ browser: ['ru'] });

    await store.init();

    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it('switches Transloco, <html lang>, the locale and the saved choice', async () => {
    const { store, storage, transloco, document } = setup();
    await store.init();

    await store.use('uz');

    expect(transloco.getActiveLang()).toBe('uz');
    expect(document.documentElement.lang).toBe('uz');
    expect(store.locale()).toBe('uz-Latn-UZ');
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('uz');
    expect(transloco.translate('language.label')).toBe('Til');
  });

  it('applies only the last of several quick switches', async () => {
    const { store, transloco } = setup();
    await store.init();

    const first: Promise<void> = store.use('ru');
    const second: Promise<void> = store.use('uz');
    await Promise.all([first, second]);

    expect(store.language()).toBe('uz');
    expect(transloco.getActiveLang()).toBe('uz');
  });

  it('keeps working when the storage throws', async () => {
    const { store, storage } = setup();
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    await expect(store.use('ru')).resolves.toBeUndefined();
    expect(store.language()).toBe('ru');
  });
});

function ignore(): void {
  // Transloco logs every failed file; the tests fail the files on purpose.
}

function setupFailing(failing: readonly string[], saved?: string): LanguageStore {
  const storage: MemoryStorage = new MemoryStorage();

  if (saved !== undefined) {
    storage.setItem(LANGUAGE_STORAGE_KEY, saved);
  }

  vi.spyOn(navigator, 'languages', 'get').mockReturnValue([]);

  TestBed.configureTestingModule({
    providers: [
      provideTransloco({
        config: {
          availableLangs: [...LANGUAGES],
          defaultLang: 'en',
          fallbackLang: 'en',
          failedRetries: 0,
          missingHandler: { logMissingKey: false },
        },
        loader: class implements TranslocoLoader {
          getTranslation(language: string): Observable<Translation> {
            return failing.includes(language)
              ? throwError(() => new Error('offline'))
              : of({ language: { label: language } });
          }
        },
      }),
      { provide: STORAGE, useValue: storage },
    ],
  });

  return TestBed.inject(LanguageStore);
}

describe('LanguageStore without translation files', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(ignore);
  });

  it('starts in English when the saved language cannot be loaded', async () => {
    const store: LanguageStore = setupFailing(['ru'], 'ru');

    await expect(store.init()).resolves.toBeUndefined();

    expect(store.language()).toBe('en');
  });

  it('still starts when no file can be loaded', async () => {
    const store: LanguageStore = setupFailing(['en', 'uz', 'ru']);

    await expect(store.init()).resolves.toBeUndefined();

    expect(store.language()).toBe('en');
  });

  it('keeps the current language when a switch fails', async () => {
    const store: LanguageStore = setupFailing(['uz']);
    await store.init();

    await expect(store.use('uz')).rejects.toThrow();

    expect(store.language()).toBe('en');
  });
});
