import { detectLanguage, isLanguage } from './languages';

describe('isLanguage', () => {
  it('accepts only the supported language codes', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('uz')).toBe(true);
    expect(isLanguage('ru')).toBe(true);
    expect(isLanguage('de')).toBe(false);
    expect(isLanguage('')).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });
});

describe('detectLanguage', () => {
  it('takes the first supported browser preference by its base code', () => {
    expect(detectLanguage(['de-DE', 'ru-RU', 'en-US'])).toBe('ru');
    expect(detectLanguage(['UZ-Latn-UZ'])).toBe('uz');
  });

  it('gives undefined when nothing is supported', () => {
    expect(detectLanguage(['de', 'fr-FR'])).toBeUndefined();
    expect(detectLanguage([])).toBeUndefined();
  });
});
