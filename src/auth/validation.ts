/**
 * Validators of the Login and Registration forms. Each returns the error message to show under the
 * field, or `undefined` when the value is valid.
 */
export type Validator = (value: string) => string | undefined;

const MIN_PASSWORD_LENGTH: number = 6;
const MIN_USERNAME_LENGTH: number = 2;
const MAX_USERNAME_LENGTH: number = 30;

// local@domain.tld without spaces; the domain has at least one dot and a 2+ letter zone.
const EMAIL_PATTERN: RegExp = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[a-z]{2,}$/i;
const USERNAME_PATTERN: RegExp = /^[A-Z][A-Za-z\d]*$/;
const UPPERCASE_PATTERN: RegExp = /[A-Z]/;
const DIGIT_PATTERN: RegExp = /\d/;
// Anything that is not an English letter, a digit or whitespace counts as a special character.
const SPECIAL_PATTERN: RegExp = /[^A-Za-z\d\s]/;

export const validateEmail: Validator = (value: string): string | undefined => {
  const email: string = value.trim();

  if (email === '') {
    return 'Email is required.';
  }

  return EMAIL_PATTERN.test(email) ? undefined : 'Enter a valid email address, e.g. name@mail.com.';
};

export const validateUsername: Validator = (value: string): string | undefined => {
  if (value === '') {
    return 'Username is required.';
  }

  if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${String(MIN_USERNAME_LENGTH)}–${String(MAX_USERNAME_LENGTH)} characters long.`;
  }

  if (!/^[A-Z]/.test(value)) {
    return 'Username must start with an uppercase English letter.';
  }

  return USERNAME_PATTERN.test(value)
    ? undefined
    : 'Username may contain English letters and digits only.';
};

export const validateLoginPassword: Validator = (value: string): string | undefined => {
  if (value === '') {
    return 'Password is required.';
  }

  return value.length < MIN_PASSWORD_LENGTH
    ? `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters long.`
    : undefined;
};

export const validateNewPassword: Validator = (value: string): string | undefined => {
  const lengthError: string | undefined = validateLoginPassword(value);

  if (lengthError !== undefined) {
    return lengthError;
  }

  if (!UPPERCASE_PATTERN.test(value)) {
    return 'Password must contain an uppercase English letter.';
  }

  if (!DIGIT_PATTERN.test(value)) {
    return 'Password must contain a digit.';
  }

  return SPECIAL_PATTERN.test(value) ? undefined : 'Password must contain a special character.';
};

/**
 * Only the match is checked: the password rules are not applied to the confirmation again.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (confirmation === '') {
    return 'Confirm your password.';
  }

  return confirmation === password ? undefined : 'Passwords do not match.';
}
