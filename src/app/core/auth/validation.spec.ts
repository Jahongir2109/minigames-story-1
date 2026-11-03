import {
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
} from './validation';

function key(result: { key: string } | undefined): string | undefined {
  return result?.key;
}

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(key(validateEmail(''))).toBe('validation.emailRequired');
    const blank: string = ' '.repeat(3);

    expect(key(validateEmail(blank))).toBe('validation.emailRequired');
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
    expect(key(validateEmail(email))).toBe('validation.emailInvalid');
  });
});

describe('validateUsername', () => {
  it('requires a value', () => {
    expect(key(validateUsername(''))).toBe('validation.usernameRequired');
  });

  it('accepts 2–30 English letters and digits starting with an uppercase letter', () => {
    expect(validateUsername('Al')).toBeUndefined();
    expect(validateUsername('CozyGamer99')).toBeUndefined();
    expect(validateUsername(`A${'b'.repeat(29)}`)).toBeUndefined();
  });

  it('checks the length and passes the limits to the message', () => {
    expect(validateUsername('A')).toEqual({
      key: 'validation.usernameLength',
      params: { min: 2, max: 30 },
    });
    const tooLong: string = `A${'b'.repeat(30)}`;

    expect(key(validateUsername(tooLong))).toBe('validation.usernameLength');
  });

  it('requires an uppercase English first letter', () => {
    expect(key(validateUsername('cozyGamer'))).toBe('validation.usernameUppercase');
    expect(key(validateUsername('9Lives'))).toBe('validation.usernameUppercase');
    expect(key(validateUsername('Ålex'))).toBe('validation.usernameUppercase');
  });

  it('allows only English letters and digits', () => {
    expect(key(validateUsername('Cozy_Gamer'))).toBe('validation.usernameCharacters');
    expect(key(validateUsername('Cozy Gamer'))).toBe('validation.usernameCharacters');
    expect(key(validateUsername('Cozyé'))).toBe('validation.usernameCharacters');
  });
});

describe('validateLoginPassword', () => {
  it('requires at least 6 characters only', () => {
    expect(key(validateLoginPassword(''))).toBe('validation.passwordRequired');
    expect(validateLoginPassword('12345')).toEqual({
      key: 'validation.passwordLength',
      params: { min: 6 },
    });
    expect(validateLoginPassword('simple')).toBeUndefined();
  });
});

describe('validateNewPassword', () => {
  it('applies the length rule first', () => {
    expect(key(validateNewPassword(''))).toBe('validation.passwordRequired');
    expect(key(validateNewPassword('A1!'))).toBe('validation.passwordLength');
  });

  it('requires an uppercase letter, a digit and a special character', () => {
    expect(key(validateNewPassword('secret1!'))).toBe('validation.passwordUppercase');
    expect(key(validateNewPassword('Secret!!'))).toBe('validation.passwordDigit');
    expect(key(validateNewPassword('Secret12'))).toBe('validation.passwordSpecial');
  });

  it('accepts a strong password', () => {
    expect(validateNewPassword('Secret1!')).toBeUndefined();
    expect(validateNewPassword('Sec_ret9')).toBeUndefined();
    expect(validateNewPassword('A1~{}[]')).toBeUndefined();
  });

  it.each(['Secret1! x', 'Parol1!ж', 'Secret1!é', 'Secret1!🍄'])(
    'rejects characters other than English letters, digits and specials in %s',
    (password: string) => {
      expect(key(validateNewPassword(password))).toBe('validation.passwordCharacters');
    },
  );

  it('keeps the login password free of these rules', () => {
    expect(validateLoginPassword('пароль 1')).toBeUndefined();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires a value', () => {
    expect(key(validatePasswordConfirmation('Secret1!', ''))).toBe(
      'validation.confirmationRequired',
    );
  });

  it('checks only that both values match', () => {
    expect(key(validatePasswordConfirmation('Secret1!', 'Secret1'))).toBe(
      'validation.confirmationMismatch',
    );
    expect(validatePasswordConfirmation('weak', 'weak')).toBeUndefined();
  });
});
