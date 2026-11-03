import type { TranslationParameters } from '@/core/i18n/translation-parameters';

/**
 * Why a value is not valid: a translation key with the values of its placeholders, so the
 * message follows the language of the UI.
 */
export interface ValidationError {
  key: string;
  params?: TranslationParameters;
}

/**
 * Validators of the Login and Registration forms: the error to show under the field, or
 * `undefined` when the value is valid.
 */
export type Validator = (value: string) => ValidationError | undefined;

export const MIN_PASSWORD_LENGTH: number = 6;
const MIN_USERNAME_LENGTH: number = 2;
const MAX_USERNAME_LENGTH: number = 30;

// local@domain.tld without spaces; the domain has at least one dot and a 2+ letter zone.
const EMAIL_PATTERN: RegExp = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[a-z]{2,}$/i;
const USERNAME_PATTERN: RegExp = /^[A-Z][A-Za-z\d]*$/;
const UPPERCASE_PATTERN: RegExp = /[A-Z]/;
const DIGIT_PATTERN: RegExp = /\d/;
// A new password may contain only English letters, digits and the special characters of the
// printable ASCII range (`!` to `~`); spaces and letters of other alphabets are not allowed.
const PASSWORD_CHARACTERS_PATTERN: RegExp = /^[!-~]+$/;
// Within the allowed characters, everything that is not an English letter or a digit is special.
const SPECIAL_PATTERN: RegExp = /[^A-Za-z\d]/;

function error(key: string, parameters?: TranslationParameters): ValidationError {
  return parameters === undefined ? { key } : { key, params: parameters };
}

export const validateEmail: Validator = (value: string) => {
  const email: string = value.trim();

  if (email === '') {
    return error('validation.emailRequired');
  }

  return EMAIL_PATTERN.test(email) ? undefined : error('validation.emailInvalid');
};

export const validateUsername: Validator = (value: string) => {
  if (value === '') {
    return error('validation.usernameRequired');
  }

  if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
    return error('validation.usernameLength', {
      min: MIN_USERNAME_LENGTH,
      max: MAX_USERNAME_LENGTH,
    });
  }

  if (!/^[A-Z]/.test(value)) {
    return error('validation.usernameUppercase');
  }

  return USERNAME_PATTERN.test(value) ? undefined : error('validation.usernameCharacters');
};

export const validateLoginPassword: Validator = (value: string) => {
  if (value === '') {
    return error('validation.passwordRequired');
  }

  return value.length < MIN_PASSWORD_LENGTH
    ? error('validation.passwordLength', { min: MIN_PASSWORD_LENGTH })
    : undefined;
};

export const validateNewPassword: Validator = (value: string) => {
  const lengthError: ValidationError | undefined = validateLoginPassword(value);

  if (lengthError !== undefined) {
    return lengthError;
  }

  if (!PASSWORD_CHARACTERS_PATTERN.test(value)) {
    return error('validation.passwordCharacters');
  }

  if (!UPPERCASE_PATTERN.test(value)) {
    return error('validation.passwordUppercase');
  }

  if (!DIGIT_PATTERN.test(value)) {
    return error('validation.passwordDigit');
  }

  return SPECIAL_PATTERN.test(value) ? undefined : error('validation.passwordSpecial');
};

/**
 * Only the match is checked: the password rules are not applied to the confirmation again.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): ValidationError | undefined {
  if (confirmation === '') {
    return error('validation.confirmationRequired');
  }

  return confirmation === password ? undefined : error('validation.confirmationMismatch');
}
