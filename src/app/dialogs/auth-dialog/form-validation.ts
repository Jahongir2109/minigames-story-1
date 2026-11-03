import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import type { ValidationError } from '@/core/auth/validation';

const ERROR_KEY: string = 'invalid';

/**
 * Turns a validator of `core/auth/validation` into an Angular validator; the translated error is
 * kept under the `invalid` key.
 */
export function toValidator(validate: (value: string) => ValidationError | undefined): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const error: ValidationError | undefined = validate(control.value);

    return error === undefined ? null : { [ERROR_KEY]: error };
  };
}

/**
 * Real-time validation: a field shows its error once the user has typed in it or left it (or
 * tried to submit the form), not while it is still untouched.
 */
export function visibleError(control: AbstractControl<string>): ValidationError | undefined {
  return !control.touched && !control.dirty
    ? undefined
    : (control.errors?.[ERROR_KEY] as ValidationError | undefined);
}
