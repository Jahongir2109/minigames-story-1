import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AuthRequest } from '@/auth/auth-service';

import { type AuthDialog, createAuthDialog } from './auth-dialog';

// An authentication request that is still running while the test inspects the dialog.
const PENDING_MS: number = 30;

function slowSuccess(): Promise<boolean> {
  return new Promise<boolean>((resolve: (isSuccess: boolean) => void): void => {
    setTimeout((): void => {
      resolve(true);
    }, PENDING_MS);
  });
}

function query(dialog: AuthDialog, selector: string): HTMLElement {
  const element: HTMLElement | null = dialog.element.querySelector<HTMLElement>(selector);

  if (element === null) {
    throw new Error(`No ${selector}`);
  }

  return element;
}

function queryInput(dialog: AuthDialog, id: string): HTMLInputElement {
  const element: HTMLElement = query(dialog, `#${id}`);

  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError(`#${id} is not an input`);
  }

  return element;
}

function queryButton(dialog: AuthDialog, selector: string): HTMLButtonElement {
  const element: HTMLElement = query(dialog, selector);

  if (!(element instanceof HTMLButtonElement)) {
    throw new TypeError(`${selector} is not a button`);
  }

  return element;
}
function type(dialog: AuthDialog, id: string, value: string): void {
  const input: HTMLInputElement = queryInput(dialog, id);

  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submitLogin(dialog: AuthDialog): void {
  type(dialog, 'login-email', 'alex@minigames.com');
  type(dialog, 'login-password', 'simple');
  query(dialog, '.auth-dialog__panel--login form').dispatchEvent(
    new SubmitEvent('submit', { cancelable: true }),
  );
}

function setup(authenticate: Mock<(request: AuthRequest) => Promise<boolean>>): AuthDialog {
  const dialog: AuthDialog = createAuthDialog({ authenticate });

  document.body.append(dialog.element);
  dialog.open('login');

  return dialog;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createAuthDialog', () => {
  it('opens in the requested mode', () => {
    const dialog: AuthDialog = setup(vi.fn());

    dialog.open('register');

    expect(dialog.element.open).toBe(true);
    expect(query(dialog, '#auth-tab-register').getAttribute('aria-selected')).toBe('true');
  });

  it('clears the fields when the user switches the mode', () => {
    const onModeChange: Mock<(mode: string) => void> = vi.fn();
    const dialog: AuthDialog = createAuthDialog({ authenticate: vi.fn(), onModeChange });

    document.body.append(dialog.element);
    dialog.open('login');
    type(dialog, 'login-email', 'alex@minigames.com');
    queryButton(dialog, '#auth-tab-register').click();

    expect(onModeChange).toHaveBeenCalledWith('register');
    expect(queryInput(dialog, 'login-email').value).toBe('');
  });

  it('closes after a successful sign-in', async () => {
    const authenticate: Mock<(request: AuthRequest) => Promise<boolean>> = vi.fn(
      (): Promise<boolean> => Promise.resolve(true),
    );
    const dialog: AuthDialog = setup(authenticate);

    submitLogin(dialog);
    await vi.waitFor(() => {
      expect(dialog.element.open).toBe(false);
    });

    expect(authenticate).toHaveBeenCalledWith({
      kind: 'login',
      email: 'alex@minigames.com',
      password: 'simple',
    });
  });

  it('stays open and unlocks for a retry after a failure', async () => {
    const dialog: AuthDialog = setup(vi.fn((): Promise<boolean> => Promise.resolve(false)));

    submitLogin(dialog);
    await vi.waitFor(() => {
      expect(queryInput(dialog, 'login-email').disabled).toBe(false);
    });

    expect(dialog.element.open).toBe(true);
    expect(queryInput(dialog, 'login-email').value).toBe('alex@minigames.com');
  });

  it('cannot be closed or switched while a request is pending', async () => {
    const authenticate: Mock<(request: AuthRequest) => Promise<boolean>> = vi.fn(slowSuccess);
    const dialog: AuthDialog = setup(authenticate);

    submitLogin(dialog);

    // Backdrop click, Escape and a programmatic close are all ignored.
    dialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const cancel: Event = new Event('cancel', { cancelable: true });

    dialog.element.dispatchEvent(cancel);
    dialog.close();

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.element.open).toBe(true);
    expect(queryButton(dialog, '#auth-tab-register').disabled).toBe(true);
    expect(queryInput(dialog, 'login-email').disabled).toBe(true);

    // A second request cannot start meanwhile.
    queryButton(dialog, '.auth-dialog__panel--login .auth-form__google').click();
    expect(authenticate).toHaveBeenCalledTimes(1);

    // The dialog closes itself once the request succeeds.
    await vi.waitFor(() => {
      expect(dialog.element.open).toBe(false);
    });
  });

  it('lets Escape close the dialog when nothing is pending', () => {
    const dialog: AuthDialog = setup(vi.fn());
    const cancel: Event = new Event('cancel', { cancelable: true });

    dialog.element.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(false);
  });

  it('closes on a backdrop click', () => {
    const dialog: AuthDialog = setup(vi.fn());

    dialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.element.open).toBe(false);
  });

  it('starts the Google sign-in', () => {
    const authenticate: Mock<(request: AuthRequest) => Promise<boolean>> = vi.fn(
      (): Promise<boolean> => Promise.resolve(false),
    );
    const dialog: AuthDialog = setup(authenticate);

    queryButton(dialog, '.auth-dialog__panel--login .auth-form__google').click();

    expect(authenticate).toHaveBeenCalledWith({ kind: 'google' });
  });

  it('switches the tabs with the arrow keys', () => {
    const dialog: AuthDialog = setup(vi.fn());

    query(dialog, '.auth-dialog__tabs').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(query(dialog, '#auth-tab-register').getAttribute('aria-selected')).toBe('true');

    query(dialog, '.auth-dialog__tabs').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    expect(query(dialog, '#auth-tab-login').getAttribute('aria-selected')).toBe('true');
  });
});
