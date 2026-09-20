import googleIcon from '@/assets/icons/google.svg?raw';
import lockIcon from '@/assets/icons/lock.svg?raw';
import mailIcon from '@/assets/icons/mail.svg?raw';
import userIcon from '@/assets/icons/user.svg?raw';
import { createButton } from '@/components/ui/button/button';
import { createTextField } from '@/components/ui/text-field/text-field';
import { createElement } from '@/shared/dom/create-element';

export type AuthMode = 'login' | 'register';

export interface AuthFormOptions {
  onSwitch: (mode: AuthMode) => void;
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

function createForm(label: string, children: readonly HTMLElement[]): HTMLFormElement {
  const form: HTMLFormElement = createElement('form', {
    className: 'auth-form__form',
    attributes: { 'aria-label': label, novalidate: '' },
    children,
  });

  // The API is connected in a later story: the form must not reload the page.
  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
  });

  return form;
}

export function createLoginForm(options: AuthFormOptions): HTMLElement {
  const email: HTMLElement = createTextField({
    id: 'login-email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'e.g. alex@minigames.com',
    autocomplete: 'email',
    icon: mailIcon,
  });
  const password: HTMLElement = createTextField({
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
    children: [email, password, forgot],
  });
  const submit: HTMLButtonElement = createButton({
    label: 'Login',
    variant: 'primary',
    size: 'large',
    type: 'submit',
    className: 'auth-form__submit',
  });
  const actions: HTMLElement = createElement('div', {
    className: 'auth-form__actions',
    children: [submit, createDivider(), createGoogleButton('Continue with Google')],
  });
  const form: HTMLFormElement = createForm('Login', [fields, actions]);

  return createElement('div', {
    className: 'auth-form',
    children: [
      createHeading('Welcome Back!', 'Sign in to resume your games and progress.'),
      form,
      createSwitchPrompt("Don't have an account?", 'Register', (): void => {
        options.onSwitch('register');
      }),
    ],
  });
}

export function createRegisterForm(options: AuthFormOptions): HTMLElement {
  const username: HTMLElement = createTextField({
    id: 'register-username',
    name: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'e.g. CozyGamer_99',
    autocomplete: 'username',
    icon: userIcon,
  });
  const email: HTMLElement = createTextField({
    id: 'register-email',
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your.email@domain.com',
    autocomplete: 'email',
    icon: mailIcon,
  });
  const password: HTMLElement = createTextField({
    id: 'register-password',
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Min. 8 characters',
    autocomplete: 'new-password',
    icon: lockIcon,
  });
  const confirmation: HTMLElement = createTextField({
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
    children: [username, email, password, confirmation],
  });
  const submit: HTMLButtonElement = createButton({
    label: 'Create Account',
    variant: 'primary',
    size: 'large',
    type: 'submit',
    className: 'auth-form__submit',
  });
  const actions: HTMLElement = createElement('div', {
    className: 'auth-form__actions',
    children: [submit, createDivider(), createGoogleButton('Sign up with Google')],
  });
  const form: HTMLFormElement = createForm('Registration', [fields, actions]);

  return createElement('div', {
    className: 'auth-form',
    children: [
      createHeading('Create Account', 'Join MiniGames to track your score & streak.'),
      form,
      createSwitchPrompt('Already have an account?', 'Login', (): void => {
        options.onSwitch('login');
      }),
    ],
  });
}
