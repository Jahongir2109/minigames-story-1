import { describe, expect, it, vi } from 'vitest';

import { type AuthForm, createLoginForm, createRegisterForm } from './auth-forms';

function getInput(form: AuthForm, id: string): HTMLInputElement {
  const input: HTMLInputElement | null = form.element.querySelector(`#${id}`);

  if (input === null) {
    throw new Error(`No input #${id}`);
  }

  return input;
}

function getSubmit(form: AuthForm): HTMLButtonElement {
  const submit: HTMLButtonElement | null = form.element.querySelector('button[type="submit"]');

  if (submit === null) {
    throw new Error('No submit button');
  }

  return submit;
}

function getError(form: AuthForm, id: string): string {
  return form.element.querySelector(`#${id}-error`)?.textContent ?? '';
}

function type(form: AuthForm, id: string, value: string): void {
  const input: HTMLInputElement = getInput(form, id);

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('createLoginForm', () => {
  it('enables Login for a valid email and a 6+ character password', () => {
    const form: AuthForm = createLoginForm({ onSwitch: vi.fn() });

    type(form, 'login-email', 'alex@minigames.com');
    type(form, 'login-password', 'short');
    expect(getSubmit(form).disabled).toBe(true);
    expect(getError(form, 'login-password')).toMatch(/at least 6/);

    // The registration strength rules do not apply to login.
    type(form, 'login-password', 'simple');
    expect(getError(form, 'login-password')).toBe('');
    expect(getSubmit(form).disabled).toBe(false);
  });

  it('shows the errors of empty fields on submit without reloading the page', () => {
    const form: AuthForm = createLoginForm({ onSwitch: vi.fn() });
    const event: SubmitEvent = new SubmitEvent('submit', { cancelable: true });

    form.element.querySelector('form')?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(getError(form, 'login-email')).toBe('Email is required.');
    expect(getError(form, 'login-password')).toBe('Password is required.');
  });

  it('switches to Register from the prompt', () => {
    const onSwitch: (mode: 'login' | 'register') => void = vi.fn();
    const form: AuthForm = createLoginForm({ onSwitch });

    form.element.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();

    expect(onSwitch).toHaveBeenCalledWith('register');
  });

  it('clears the fields and errors on reset', () => {
    const form: AuthForm = createLoginForm({ onSwitch: vi.fn() });

    type(form, 'login-email', 'wrong');
    form.reset();

    expect(getInput(form, 'login-email').value).toBe('');
    expect(getError(form, 'login-email')).toBe('');
  });
});

function fillValidRegistration(form: AuthForm): void {
  type(form, 'register-username', 'CozyGamer99');
  type(form, 'register-email', 'cozy@minigames.com');
  type(form, 'register-password', 'Secret1!');
  type(form, 'register-password-confirmation', 'Secret1!');
}

describe('createRegisterForm', () => {
  it('enables Create Account only when every field is valid', () => {
    const form: AuthForm = createRegisterForm({ onSwitch: vi.fn() });

    expect(getSubmit(form).disabled).toBe(true);

    fillValidRegistration(form);

    expect(getSubmit(form).disabled).toBe(false);
  });

  it('applies the username and password strength rules', () => {
    const form: AuthForm = createRegisterForm({ onSwitch: vi.fn() });

    type(form, 'register-username', 'cozy');
    type(form, 'register-password', 'secret1');

    expect(getError(form, 'register-username')).toMatch(/uppercase English letter/);
    expect(getError(form, 'register-password')).toMatch(/uppercase/);
  });

  it('revalidates the confirmation when the password changes', () => {
    const form: AuthForm = createRegisterForm({ onSwitch: vi.fn() });

    fillValidRegistration(form);
    type(form, 'register-password', 'Secret2!');

    expect(getError(form, 'register-password-confirmation')).toBe('Passwords do not match.');
    expect(getSubmit(form).disabled).toBe(true);
  });

  it('switches to Login from the prompt', () => {
    const onSwitch: (mode: 'login' | 'register') => void = vi.fn();
    const form: AuthForm = createRegisterForm({ onSwitch });

    form.element.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();

    expect(onSwitch).toHaveBeenCalledWith('login');
  });
});
