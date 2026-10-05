import type { TextField } from '@/components/ui/text-field/text-field';

export interface ValidatedField {
  field: TextField;
  /**
   * Returns the error of the current value, or `undefined` when it is valid.
   */
  validate: () => string | undefined;
  /**
   * Inputs whose changes revalidate this field too (the confirmation follows the password).
   */
  dependsOn?: readonly HTMLInputElement[];
}

export interface FormValidation {
  isValid: () => boolean;
  /**
   * Shows the errors of all fields, also the untouched ones (used on submit).
   */
  showAllErrors: () => void;
  /**
   * Clears the values and the errors, e.g. when the user switches between Login and Register.
   */
  reset: () => void;
}

/**
 * Real-time validation of a form: a field shows its error once the user has typed in it or left
 * it, and the submit button stays disabled while any field is invalid.
 */
export function createFormValidation(
  fields: readonly ValidatedField[],
  submit: HTMLButtonElement,
): FormValidation {
  const touched: Set<ValidatedField> = new Set<ValidatedField>();

  const isValid = (): boolean =>
    fields.every((item: ValidatedField): boolean => item.validate() === undefined);

  const updateSubmit = (): void => {
    submit.disabled = !isValid();
  };

  const showError = (item: ValidatedField): void => {
    item.field.setError(touched.has(item) ? item.validate() : undefined);
  };

  const touch = (item: ValidatedField): void => {
    touched.add(item);
    showError(item);
    updateSubmit();
  };

  for (const item of fields) {
    item.field.input.addEventListener('input', (): void => {
      touch(item);
    });
    item.field.input.addEventListener('blur', (): void => {
      touch(item);
    });

    const dependencies: readonly HTMLInputElement[] = item.dependsOn ?? [];

    for (const dependency of dependencies) {
      dependency.addEventListener('input', (): void => {
        showError(item);
        updateSubmit();
      });
    }
  }

  const showAllErrors = (): void => {
    for (const item of fields) {
      touched.add(item);
      showError(item);
    }

    updateSubmit();
  };

  const reset = (): void => {
    touched.clear();

    for (const item of fields) {
      item.field.input.value = '';
      item.field.setError(undefined);
    }

    updateSubmit();
  };

  updateSubmit();

  return { isValid, showAllErrors, reset };
}
