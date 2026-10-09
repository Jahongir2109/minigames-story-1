import { describe, expect, it, vi } from 'vitest';

import type { LoginRequest, RegisterRequest } from '@/auth/auth-service';

import {
  type AuthForm,
  type AuthFormOptions,
  createLoginForm,
  createRegisterForm,
} from './auth-forms';

function loginOptions(): AuthFormOptions<LoginRequest> {
  return { onSwitch: vi.fn(), onSubmit: vi.fn(), onGoogle: vi.fn() };
}

function registerOptions(): AuthFormOptions<RegisterRequest> {
  return { onSwitch: vi.fn(), onSubmit: vi.fn(), onGoogle: vi.fn() };
}

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
    const form: AuthForm = createLoginForm(loginOptions());

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
    const form: AuthForm = createLoginForm(loginOptions());
    const event: SubmitEvent = new SubmitEvent('submit', { cancelable: true });

    form.element.querySelector('form')?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(getError(form, 'login-email')).toBe('Email is required.');
    expect(getError(form, 'login-password')).toBe('Password is required.');
  });

  it('switches to Register from the prompt', () => {
    const onSwitch: (mode: 'login' | 'register') => void = vi.fn();
    const form: AuthForm = createLoginForm({ ...loginOptions(), onSwitch });

    form.element.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();

    expect(onSwitch).toHaveBeenCalledWith('register');
  });

  it('clears the fields and errors on reset', () => {
    const form: AuthForm = createLoginForm(loginOptions());

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
    const form: AuthForm = createRegisterForm(registerOptions());

    expect(getSubmit(form).disabled).toBe(true);

    fillValidRegistration(form);

    expect(getSubmit(form).disabled).toBe(false);
  });

  it('applies the username and password strength rules', () => {
    const form: AuthForm = createRegisterForm(registerOptions());

    type(form, 'register-username', 'cozy');
    type(form, 'register-password', 'secret1');

    expect(getError(form, 'register-username')).toMatch(/uppercase English letter/);
    expect(getError(form, 'register-password')).toMatch(/uppercase/);
  });

  it('revalidates the confirmation when the password changes', () => {
    const form: AuthForm = createRegisterForm(registerOptions());

    fillValidRegistration(form);
    type(form, 'register-password', 'Secret2!');

    expect(getError(form, 'register-password-confirmation')).toBe('Passwords do not match.');
    expect(getSubmit(form).disabled).toBe(true);
  });

  it('switches to Login from the prompt', () => {
    const onSwitch: (mode: 'login' | 'register') => void = vi.fn();
    const form: AuthForm = createRegisterForm({ ...registerOptions(), onSwitch });

    form.element.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();

    expect(onSwitch).toHaveBeenCalledWith('login');
  });
});

function submitForm(form: AuthForm): void {
  form.element
    .querySelector('form')
    ?.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
}

describe('auth form actions', () => {
  it('submits the trimmed login values of a valid form', () => {
    const options: AuthFormOptions<LoginRequest> = loginOptions();
    const form: AuthForm = createLoginForm(options);

    type(form, 'login-email', '  alex@minigames.com ');
    type(form, 'login-password', 'simple');
    submitForm(form);

    expect(options.onSubmit).toHaveBeenCalledExactlyOnceWith({
      kind: 'login',
      email: 'alex@minigames.com',
      password: 'simple',
    });
  });

  it('does not submit an invalid form', () => {
    const options: AuthFormOptions<LoginRequest> = loginOptions();
    const form: AuthForm = createLoginForm(options);

    type(form, 'login-email', 'alex');
    submitForm(form);

    expect(options.onSubmit).not.toHaveBeenCalled();
  });

  it('submits the registration values with the username', () => {
    const options: AuthFormOptions<RegisterRequest> = registerOptions();
    const form: AuthForm = createRegisterForm(options);

    fillValidRegistration(form);
    submitForm(form);

    expect(options.onSubmit).toHaveBeenCalledExactlyOnceWith({
      kind: 'register',
      username: 'CozyGamer99',
      email: 'cozy@minigames.com',
      password: 'Secret1!',
    });
  });

  it('starts the Google sign-in from both forms', () => {
    const login: AuthFormOptions<LoginRequest> = loginOptions();
    const register: AuthFormOptions<RegisterRequest> = registerOptions();

    createLoginForm(login).element.querySelector<HTMLButtonElement>('.auth-form__google')?.click();
    createRegisterForm(register)
      .element.querySelector<HTMLButtonElement>('.auth-form__google')
      ?.click();

    expect(login.onGoogle).toHaveBeenCalledTimes(1);
    expect(register.onGoogle).toHaveBeenCalledTimes(1);
  });

  it('locks every field and action while pending and unlocks them afterwards', () => {
    const form: AuthForm = createRegisterForm(registerOptions());

    fillValidRegistration(form);
    form.setPending(true);

    const controls: HTMLInputElement[] = [
      ...form.element.querySelectorAll<HTMLInputElement>('input, button'),
    ];

    expect(controls.every((control: HTMLInputElement): boolean => control.disabled)).toBe(true);
    expect(getSubmit(form).textContent).toBe('Please wait…');
    expect(form.element.getAttribute('aria-busy')).toBe('true');

    form.setPending(false);

    expect(controls.some((control: HTMLInputElement): boolean => control.disabled)).toBe(false);
    expect(getSubmit(form).textContent).toBe('Create Account');
  });

  it('keeps the submit disabled after unlocking an invalid form', () => {
    const form: AuthForm = createLoginForm(loginOptions());

    form.setPending(true);
    form.setPending(false);

    expect(getSubmit(form).disabled).toBe(true);
    expect(getInput(form, 'login-email').disabled).toBe(false);
  });
});
