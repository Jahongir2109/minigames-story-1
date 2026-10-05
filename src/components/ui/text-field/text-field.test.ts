import { describe, expect, it } from 'vitest';

import { createTextField, type TextField } from './text-field';

function createField(type: 'email' | 'password' = 'email'): TextField {
  return createTextField({
    id: 'test-field',
    name: 'test',
    label: 'Test',
    type,
    placeholder: '',
    autocomplete: 'off',
    icon: '<svg></svg>',
  });
}

describe('createTextField', () => {
  it('links the label and the error message to the input', () => {
    const field: TextField = createField();

    expect(field.element.querySelector('label')?.htmlFor).toBe('test-field');
    expect(field.input.id).toBe('test-field');
    expect(field.input.getAttribute('aria-describedby')).toBe('test-field-error');
  });

  it('shows and clears the error', () => {
    const field: TextField = createField();
    const error: HTMLElement | null = field.element.querySelector('#test-field-error');

    field.setError('Email is required.');

    expect(error?.textContent).toBe('Email is required.');
    expect(field.input.getAttribute('aria-invalid')).toBe('true');
    expect(field.element.dataset.invalid).toBe('true');

    field.setError(undefined);

    expect(error?.textContent).toBe('');
    expect(field.input.getAttribute('aria-invalid')).toBe('false');
    expect(field.element.dataset.invalid).toBe('false');
  });

  it('toggles the password visibility', () => {
    const field: TextField = createField('password');
    const toggle: HTMLButtonElement | null = field.element.querySelector('.text-field__toggle');

    toggle?.click();

    expect(field.input.type).toBe('text');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(toggle?.getAttribute('aria-label')).toBe('Hide password');

    toggle?.click();

    expect(field.input.type).toBe('password');
    expect(toggle?.getAttribute('aria-label')).toBe('Show password');
  });

  it('has no visibility toggle for other fields', () => {
    expect(createField('email').element.querySelector('.text-field__toggle')).toBeNull();
  });
});
