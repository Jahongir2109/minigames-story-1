import googleIcon from '@/assets/icons/google.svg?raw';
import lockIcon from '@/assets/icons/lock.svg?raw';
import mailIcon from '@/assets/icons/mail.svg?raw';
import userIcon from '@/assets/icons/user.svg?raw';
import {
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
} from '@/auth/validation';
import { createButton } from '@/components/ui/button/button';
import { createTextField, type TextField } from '@/components/ui/text-field/text-field';
import { createElement } from '@/shared/dom/create-element';

import { createFormValidation, type FormValidation } from './form-validation';

export type AuthMode = 'login' | 'register';

export interface AuthFormOptions {
  onSwitch: (mode: AuthMode) => void;
}

export interface AuthForm {
  element: HTMLElement;
  /**
   * Clears the fields and their errors.
   */
  reset: () => void;
}

function createHeading(title: string, subtitle: string): HTMLElement {
  return createElement('header', {
    className: 'auth-form__header',
    children: [
      createElement('h2', { className: 'auth-form__title', text: title }),
      createElement('p', { className: 'auth-form__subtitle', text: subtitle }),
    ],
  });
}

function createTextButton(label: string, className: string): HTMLButtonElement {
  return createElement('button', {
    className: `auth-form__link ${className}`,
    text: label,
    attributes: { type: 'button' },
  });
}

function createDivider(): HTMLElement {
  return createElement('p', {
    className: 'auth-form__divider',
    children: [createElement('span', { text: 'OR' })],
  });
}

function createGoogleButton(label: string): HTMLButtonElement {
  return createButton({
    label,
    variant: 'outline',
    size: 'large',
    icon: googleIcon,
    className: 'auth-form__google',
  });
}

function createSwitchPrompt(
  question: string,
  action: string,
  onClick: () => void,
): HTMLParagraphElement {
  const link: HTMLButtonElement = createTextButton(action, 'auth-form__switch');

  link.addEventListener('click', onClick);

  return createElement('p', {
    className: 'auth-form__prompt',
    children: [`${question} `, link],
  });
}

function createForm(
  label: string,
  children: readonly HTMLElement[],
  validation: FormValidation,
): HTMLFormElement {
  const form: HTMLFormElement = createElement('form', {
    className: 'auth-form__form',
    attributes: { 'aria-label': label, novalidate: '' },
    children,
  });

  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
    validation.showAllErrors();
  });

  return form;
}

function createSubmitButton(label: string): HTMLButtonElement {
  return createButton({
    label,
    variant: 'primary',
    size: 'large',
    type: 'submit',
    className: 'auth-form__submit',
  });
}

export function createLoginForm(options: AuthFormOptions): AuthForm {
  const email: TextField = createTextField({
    id: 'login-email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'e.g. alex@minigames.com',
    autocomplete: 'email',
    icon: mailIcon,
  });
  const password: TextField = createTextField({
    id: 'login-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    autocomplete: 'current-password',
    icon: lockIcon,
  });
  const forgot: HTMLButtonElement = createTextButton('Forgot Password?', 'auth-form__forgot');
  const fields: HTMLElement = createElement('div', {
    className: 'auth-form__fields',
    children: [email.element, password.element, forgot],
  });
  const submit: HTMLButtonElement = createSubmitButton('Login');
  const actions: HTMLElement = createElement('div', {
    className: 'auth-form__actions',
    children: [submit, createDivider(), createGoogleButton('Continue with Google')],
  });
  const validation: FormValidation = createFormValidation(
    [
      { field: email, validate: (): string | undefined => validateEmail(email.input.value) },
      {
        field: password,
        validate: (): string | undefined => validateLoginPassword(password.input.value),
      },
    ],
    submit,
  );
  const form: HTMLFormElement = createForm('Login', [fields, actions], validation);

  const element: HTMLElement = createElement('div', {
    className: 'auth-form',
    children: [
      createHeading('Welcome Back!', 'Sign in to resume your games and progress.'),
      form,
      createSwitchPrompt("Don't have an account?", 'Register', (): void => {
        options.onSwitch('register');
      }),
    ],
  });

  return { element, reset: validation.reset };
}

export function createRegisterForm(options: AuthFormOptions): AuthForm {
  const username: TextField = createTextField({
    id: 'register-username',
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'e.g. CozyGamer99',
    autocomplete: 'username',
    icon: userIcon,
  });
  const email: TextField = createTextField({
    id: 'register-email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your.email@domain.com',
    autocomplete: 'email',
    icon: mailIcon,
  });
  const password: TextField = createTextField({
    id: 'register-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Min. 6 characters',
    autocomplete: 'new-password',
    icon: lockIcon,
  });
  const confirmation: TextField = createTextField({
    id: 'register-password-confirmation',
    name: 'password-confirmation',
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Repeat your password',
    autocomplete: 'new-password',
    icon: lockIcon,
  });
  const fields: HTMLElement = createElement('div', {
    className: 'auth-form__fields',
    children: [username.element, email.element, password.element, confirmation.element],
  });
  const submit: HTMLButtonElement = createSubmitButton('Create Account');
  const actions: HTMLElement = createElement('div', {
    className: 'auth-form__actions',
    children: [submit, createDivider(), createGoogleButton('Sign up with Google')],
  });
  const validation: FormValidation = createFormValidation(
    [
      {
        field: username,
        validate: (): string | undefined => validateUsername(username.input.value),
      },
      { field: email, validate: (): string | undefined => validateEmail(email.input.value) },
      {
        field: password,
        validate: (): string | undefined => validateNewPassword(password.input.value),
      },
      {
        field: confirmation,
        validate: (): string | undefined =>
          validatePasswordConfirmation(password.input.value, confirmation.input.value),
        dependsOn: [password.input],
      },
    ],
    submit,
  );
  const form: HTMLFormElement = createForm('Registration', [fields, actions], validation);

  const element: HTMLElement = createElement('div', {
    className: 'auth-form',
    children: [
      createHeading('Create Account', 'Join MiniGames to track your score & streak.'),
      form,
      createSwitchPrompt('Already have an account?', 'Login', (): void => {
        options.onSwitch('login');
      }),
    ],
  });

  return { element, reset: validation.reset };
}
