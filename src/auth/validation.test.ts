import { describe, expect, it } from 'vitest';

import {
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
} from './validation';

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required.');
    expect(validateEmail(' '.repeat(3))).toBe('Email is required.');
  });

  it.each(['student@rs.school', 'alex.pro+games@mail.co.uk', ' alex@minigames.com '])(
    'accepts %s',
    (email: string) => {
      expect(validateEmail(email)).toBeUndefined();
    },
  );

  it.each([
    'alex',
    'alex@',
    '@mail.com',
    'alex@mail',
    'alex@mail.c',
    'al ex@mail.com',
    'a@b@c.com',
  ])('rejects %s', (email: string) => {
    expect(validateEmail(email)).toMatch(/valid email/);
  });
});

describe('validateUsername', () => {
  it('requires a value', () => {
    expect(validateUsername('')).toBe('Username is required.');
  });

  it('accepts 2–30 English letters and digits starting with an uppercase letter', () => {
    expect(validateUsername('Al')).toBeUndefined();
    expect(validateUsername('CozyGamer99')).toBeUndefined();
    expect(validateUsername(`A${'b'.repeat(29)}`)).toBeUndefined();
  });

  it('checks the length', () => {
    expect(validateUsername('A')).toMatch(/2–30 characters/);
    expect(validateUsername(`A${'b'.repeat(30)}`)).toMatch(/2–30 characters/);
  });

  it('requires an uppercase English first letter', () => {
    expect(validateUsername('cozyGamer')).toMatch(/start with an uppercase/);
    expect(validateUsername('9Lives')).toMatch(/start with an uppercase/);
    expect(validateUsername('Ålex')).toMatch(/start with an uppercase/);
  });

  it('allows only English letters and digits', () => {
    expect(validateUsername('Cozy_Gamer')).toMatch(/letters and digits only/);
    expect(validateUsername('Cozy Gamer')).toMatch(/letters and digits only/);
    expect(validateUsername('Cozyé')).toMatch(/letters and digits only/);
  });
});

describe('validateLoginPassword', () => {
  it('requires at least 6 characters only', () => {
    expect(validateLoginPassword('')).toBe('Password is required.');
    expect(validateLoginPassword('12345')).toMatch(/at least 6/);
    expect(validateLoginPassword('simple')).toBeUndefined();
  });
});

describe('validateNewPassword', () => {
  it('applies the length rule first', () => {
    expect(validateNewPassword('')).toBe('Password is required.');
    expect(validateNewPassword('A1!')).toMatch(/at least 6/);
  });

  it('requires an uppercase letter, a digit and a special character', () => {
    expect(validateNewPassword('secret1!')).toMatch(/uppercase/);
    expect(validateNewPassword('Secret!!')).toMatch(/digit/);
    expect(validateNewPassword('Secret12')).toMatch(/special character/);
  });

  it('accepts a strong password', () => {
    expect(validateNewPassword('Secret1!')).toBeUndefined();
    expect(validateNewPassword('Sec_ret9')).toBeUndefined();
    expect(validateNewPassword('A1~{}[]')).toBeUndefined();
  });

  it.each(['Secret1! x', 'Parol1!ж', 'Secret1!é', 'Secret1!🍄'])(
    'rejects characters other than English letters, digits and specials in %s',
    (password: string) => {
      expect(validateNewPassword(password)).toBe(
        'Password may contain English letters, digits and special characters only.',
      );
    },
  );

  it('keeps the login password free of these rules', () => {
    expect(validateLoginPassword('пароль 1')).toBeUndefined();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires a value', () => {
    expect(validatePasswordConfirmation('Secret1!', '')).toBe('Confirm your password.');
  });

  it('checks only that both values match', () => {
    expect(validatePasswordConfirmation('Secret1!', 'Secret1')).toBe('Passwords do not match.');
    expect(validatePasswordConfirmation('weak', 'weak')).toBeUndefined();
  });
});
