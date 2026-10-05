import { describe, expect, it } from 'vitest';

import { createTextField, type TextField } from '@/components/ui/text-field/text-field';

import { createFormValidation, type FormValidation } from './form-validation';

function createField(id: string): TextField {
  return createTextField({
    id,
    name: id,
    label: id,
    type: 'text',
    placeholder: '',
    autocomplete: 'off',
    icon: '<svg></svg>',
  });
}

function getError(field: TextField): string {
  return field.element.querySelector('.text-field__error')?.textContent ?? '';
}

function type(field: TextField, value: string): void {
  field.input.value = value;
  field.input.dispatchEvent(new Event('input'));
}

const required = (field: TextField) => (): string | undefined =>
  field.input.value === '' ? 'Required.' : undefined;

interface Setup {
  first: TextField;
  second: TextField;
  submit: HTMLButtonElement;
  validation: FormValidation;
}

function setup(): Setup {
  const first: TextField = createField('first');
  const second: TextField = createField('second');
  const submit: HTMLButtonElement = document.createElement('button');
  const validation: FormValidation = createFormValidation(
    [
      { field: first, validate: required(first) },
      {
        field: second,
        validate: (): string | undefined =>
          second.input.value === first.input.value ? undefined : 'Must match.',
        dependsOn: [first.input],
      },
    ],
    submit,
  );

  return { first, second, submit, validation };
}

describe('createFormValidation', () => {
  it('starts with the submit disabled and no errors shown', () => {
    const { first, second, submit } = setup();

    expect(submit.disabled).toBe(true);
    expect(getError(first)).toBe('');
    expect(getError(second)).toBe('');
  });

  it('validates a field while the user types', () => {
    const { first } = setup();

    type(first, 'a');
    expect(getError(first)).toBe('');

    type(first, '');
    expect(getError(first)).toBe('Required.');
  });

  it('validates a field when the user leaves it', () => {
    const { first, second } = setup();

    first.input.dispatchEvent(new Event('blur'));

    expect(getError(first)).toBe('Required.');
    expect(getError(second)).toBe('');
  });

  it('enables the submit only when every field is valid', () => {
    const { first, second, submit } = setup();

    type(first, 'secret');
    expect(submit.disabled).toBe(true);

    type(second, 'secret');
    expect(submit.disabled).toBe(false);
  });

  it('revalidates a dependent field when its dependency changes', () => {
    const { first, second, submit } = setup();

    type(first, 'secret');
    type(second, 'secret');
    type(first, 'secret2');

    expect(getError(second)).toBe('Must match.');
    expect(submit.disabled).toBe(true);
  });

  it('keeps an untouched dependent field quiet', () => {
    const { first, second } = setup();

    type(first, 'secret');

    expect(getError(second)).toBe('');
  });

  it('shows the errors of untouched fields on demand', () => {
    const { first, second, validation } = setup();

    type(second, 'x');
    validation.showAllErrors();

    expect(getError(first)).toBe('Required.');
    expect(getError(second)).toBe('Must match.');
    expect(validation.isValid()).toBe(false);
  });

  it('clears the values and the errors on reset', () => {
    const { first, second, submit, validation } = setup();

    type(first, 'secret');
    type(second, 'other');
    validation.reset();

    expect(first.input.value).toBe('');
    expect(second.input.value).toBe('');
    expect(getError(second)).toBe('');
    expect(submit.disabled).toBe(true);

    // After a reset the fields are untouched again.
    second.input.dispatchEvent(new Event('input'));
    expect(getError(first)).toBe('');
  });
});
