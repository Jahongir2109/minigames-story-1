import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Authenticator } from '@/core/auth/authenticator';
import { SESSION_STORAGE_KEY, type UserProfile } from '@/core/auth/session';
import { Session } from '@/core/auth/session.service';
import { STORAGE } from '@/core/storage/storage';
import { Header } from '@/layout/header/header';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { provideTestApi } from '../../../testing/api';
import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { DialogHost } from '../dialog-host';

@Component({
  imports: [DialogHost, Header],
  template: '<app-header /><app-dialog-host />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Blank {}

const PROFILE: UserProfile = { displayName: 'Cozy Gamer', email: 'cozy@mail.com' };

interface Setup {
  fixture: ComponentFixture<Host>;
  root: HTMLElement;
  router: Router;
  signIn: ReturnType<typeof vi.fn>;
  storage: MemoryStorage;
}

async function setup(url: string, storage: MemoryStorage = new MemoryStorage()): Promise<Setup> {
  const signIn: ReturnType<typeof vi.fn> = vi.fn((): Promise<UserProfile> =>
    Promise.resolve(PROFILE),
  );

  TestBed.configureTestingModule({
    imports: [Host],
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      provideTestApi(),
      provideTestI18n(),
      { provide: STORAGE, useValue: storage },
      {
        provide: Authenticator,
        useValue: { signIn, signOut: vi.fn((): Promise<void> => Promise.resolve()) },
      },
    ],
  });

  const router: Router = TestBed.inject(Router);

  await router.navigateByUrl(url);
  TestBed.inject(Session).watch();

  const fixture: ComponentFixture<Host> = TestBed.createComponent(Host);

  await fixture.whenStable();

  return { fixture, root: fixture.nativeElement as HTMLElement, router, signIn, storage };
}

function type(root: HTMLElement, id: string, value: string): void {
  const input: HTMLInputElement | null = root.querySelector(`#${id}`);

  if (input === null) {
    throw new Error(`No #${id}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

describe('Auth', () => {
  it('opens Login from the URL and validates the fields while the user types', async () => {
    const { fixture, root } = await setup('/?auth=login');
    const submit: HTMLButtonElement | null = root.querySelector(
      ':scope app-login-form .auth-form__submit',
    );

    expect(root.querySelector<HTMLDialogElement>('dialog.auth-dialog')?.open).toBe(true);
    expect(submit?.disabled).toBe(true);

    type(root, 'login-email', 'alex@');
    type(root, 'login-password', '123');
    await fixture.whenStable();

    expect(root.querySelector('#login-email-error')?.textContent.trim()).toBe(
      'Enter a valid email address, e.g. name@mail.com.',
    );
    expect(root.querySelector('#login-password-error')?.textContent.trim()).toBe(
      'Password must be at least 6 characters long.',
    );
    expect(root.querySelector('#login-email')?.getAttribute('aria-invalid')).toBe('true');

    type(root, 'login-email', ' alex@minigames.com ');
    type(root, 'login-password', 'secret');
    await fixture.whenStable();

    expect(submit?.disabled).toBe(false);
  });

  it('signs in, starts the session, closes the dialog and shows the profile', async () => {
    const { fixture, root, router, signIn, storage } = await setup('/library?auth=login');

    type(root, 'login-email', ' alex@minigames.com ');
    type(root, 'login-password', 'secret');
    await fixture.whenStable();
    root.querySelector<HTMLButtonElement>(':scope app-login-form .auth-form__submit')?.click();

    await vi.waitFor(() => {
      expect(router.url).toBe('/library');
    });
    await fixture.whenStable();

    expect(signIn).toHaveBeenCalledWith({
      kind: 'login',
      email: 'alex@minigames.com',
      password: 'secret',
    });
    expect(storage.getItem(SESSION_STORAGE_KEY)).toContain('cozy@mail.com');
    expect(root.querySelector(':scope .header .user-profile__name')?.textContent).toBe(
      'Cozy Gamer',
    );
    expect(root.querySelector(':scope .header .user-avatar__initials')?.textContent).toBe('CG');
    expect(root.querySelector('.header__login')).toBeNull();
  });

  it('switches to Register through the URL and starts the other form empty', async () => {
    const { fixture, root, router } = await setup('/?auth=login');

    type(root, 'login-email', 'alex@minigames.com');
    root.querySelector<HTMLButtonElement>('#auth-tab-register')?.click();
    await vi.waitFor(() => {
      expect(router.url).toBe('/?auth=register');
    });
    await fixture.whenStable();

    expect(root.querySelector('#auth-tab-register')?.getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector<HTMLInputElement>('#login-email')?.value).toBe('');
  });

  it('never opens Auth for a signed-in user', async () => {
    const storage: MemoryStorage = new MemoryStorage();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...PROFILE, authenticatedAt: Date.now() }),
    );

    const show: ReturnType<typeof vi.spyOn> = vi.spyOn(Snackbar.prototype, 'show');
    const { root, router } = await setup('/?auth=login', storage);

    await vi.waitFor(() => {
      expect(router.url).toBe('/');
    });

    expect(root.querySelector<HTMLDialogElement>('dialog.auth-dialog')?.open).toBe(false);
    expect(show).toHaveBeenCalledWith({ message: 'auth.already', variant: 'info' });
  });

  it('logs out back to Guest Mode', async () => {
    const storage: MemoryStorage = new MemoryStorage();

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...PROFILE, authenticatedAt: Date.now() }),
    );

    const { fixture, root } = await setup('/', storage);

    root.querySelector<HTMLButtonElement>(':scope .header .user-profile__logout')?.click();
    await vi.waitFor(() => {
      expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
    await fixture.whenStable();

    expect(root.querySelector('.header__login')).not.toBeNull();
  });
});
