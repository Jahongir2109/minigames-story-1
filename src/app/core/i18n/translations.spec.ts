import MessageFormat from '@messageformat/core';

import { TRANSLATIONS } from '../../../testing/i18n';
import { type Language, LANGUAGES } from './languages';

type Messages = Readonly<Record<string, string>>;

function flatten(tree: unknown, prefix: string = ''): Messages {
  const messages: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    const path: string = prefix === '' ? key : `${prefix}.${key}`;

    if (typeof value === 'string') {
      messages[path] = value;
    } else {
      Object.assign(messages, flatten(value, path));
    }
  }

  return messages;
}

function byName(a: string, b: string): number {
  return a.localeCompare(b);
}

const FLAT: Readonly<Record<Language, Messages>> = {
  en: flatten(TRANSLATIONS.en),
  uz: flatten(TRANSLATIONS.uz),
  ru: flatten(TRANSLATIONS.ru),
};

describe('translation files', () => {
  it.each(LANGUAGES.filter((language: Language) => language !== 'en'))(
    '%s has exactly the same keys as en',
    (language: Language) => {
      expect(Object.keys(FLAT[language]).toSorted(byName)).toEqual(
        Object.keys(FLAT.en).toSorted(byName),
      );
    },
  );

  it.each(LANGUAGES)('%s has no empty messages', (language: Language) => {
    const empty: string[] = Object.entries(FLAT[language])
      .filter(([, message]: [string, string]) => message.trim() === '')
      .map(([key]: [string, string]) => key);

    expect(empty).toEqual([]);
  });

  it.each(LANGUAGES)('%s messages are valid ICU for its plural rules', (language: Language) => {
    const format: MessageFormat = new MessageFormat(language);
    const messages: [string, string][] = Object.entries(FLAT[language]);

    for (const [key, message] of messages) {
      expect(() => format.compile(message), key).not.toThrow();
    }
  });

  it('uses the Russian plural forms', () => {
    const format: MessageFormat = new MessageFormat('ru');
    const games: (parameters: { count: number }) => string = format.compile(
      FLAT.ru['common.gamesCount'] ?? '',
    );

    expect([1, 3, 5, 21].map((count: number) => games({ count }))).toEqual([
      '1 игра',
      '3 игры',
      '5 игр',
      '21 игра',
    ]);
  });
});
