import { beforeAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { SESSION_STORAGE_KEY } from '@/auth/session';
import { commentsResponse, GAME, json, stubApi, type ApiRequest } from '@/test-utils/api';

import { mountApp } from './app';
import { navigate } from './navigation';

interface FirebaseMocks {
  signOut: Mock<() => Promise<void>>;
}

const firebaseMocks: FirebaseMocks = vi.hoisted((): FirebaseMocks => ({
  signOut: vi.fn((): Promise<void> => Promise.resolve()),
}));

vi.mock('@/auth/firebase', () => ({ getFirebaseAuth: (): object => ({}) }));
vi.mock('firebase/auth', () => ({ signOut: firebaseMocks.signOut }));

const root: HTMLElement = document.createElement('div');

function answer(request: ApiRequest): Response {
  if (request.path === '/categories') {
    return json({ data: [{ slug: 'all', label: 'All', isDefault: true }] });
  }

  if (request.path === '/games') {
    return json({ data: [], meta: { page: 1, limit: 6, totalItems: 0, totalPages: 0 } });
  }

  if (request.path === '/leaderboard') {
    return json({ data: [] });
  }

  return request.path.endsWith('/comments') ? commentsResponse([], 0) : json({ data: GAME });
}

function authDialog(): HTMLDialogElement {
  const dialog: HTMLDialogElement | null = root.querySelector('.auth-dialog');

  if (dialog === null) {
    throw new Error('No auth dialog');
  }

  return dialog;
}

function gameDialog(): HTMLDialogElement {
  const dialog: HTMLDialogElement | null = root.querySelector('.game-dialog');

  if (dialog === null) {
    throw new Error('No game dialog');
  }

  return dialog;
}

function snackbarText(): string {
  return document.querySelector('.snackbar-region')?.textContent ?? '';
}

function signInInStorage(): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      displayName: 'Alex Pro',
      email: 'alex@rs.school',
      authenticatedAt: Date.now(),
    }),
  );
}

// The app registers global listeners, so it is mounted once and the tests run as one story.
beforeAll(() => {
  localStorage.clear();
  history.replaceState(null, '', '/');
  stubApi(answer);
  document.body.append(root);
  mountApp(root);
});

beforeEach(() => {
  stubApi(answer);
  document.querySelector('.snackbar-region')?.replaceChildren();
});

describe('mountApp', () => {
  it('renders the shell and the page of the URL', () => {
    expect(root.querySelector('.header')).not.toBeNull();
    expect(root.querySelector('main')).not.toBeNull();
    expect(root.querySelector('footer')).not.toBeNull();
    expect(authDialog().open).toBe(false);
  });

  it('opens Auth for a guest from the header and the URL', () => {
    root.querySelector<HTMLButtonElement>('.header__signup')?.click();

    expect(new URLSearchParams(location.search).get('auth')).toBe('register');
    expect(authDialog().open).toBe(true);

    authDialog().close();
    navigate('/library?auth=login');

    expect(authDialog().open).toBe(true);

    authDialog().close();
    navigate('/library', { replace: true });
  });

  it('shows Auth over Game Details for a protected action of a guest', async () => {
    navigate('/library?game=tukoni-forest-keepers');
    await vi.waitFor(() => {
      expect(root.querySelector('#game-dialog-title')?.textContent).toBe(GAME.name);
    });

    root.querySelector<HTMLButtonElement>('.game-info__favorite')?.click();

    expect(location.search).toBe('?game=tukoni-forest-keepers&auth=login');
    expect(authDialog().open).toBe(true);
    expect(gameDialog().open).toBe(false);
    expect(snackbarText()).toContain('Log in to add games to your favorites.');

    // Closing Auth goes back to the game, which is still loaded.
    navigate('/library?game=tukoni-forest-keepers', { replace: true });

    expect(authDialog().open).toBe(false);
    expect(gameDialog().open).toBe(true);
    expect(root.querySelector('#game-dialog-title')?.textContent).toBe(GAME.name);

    gameDialog().close();
    navigate('/library', { replace: true });
  });

  it('keeps a signed-in user out of Auth and cleans the URL', () => {
    signInInStorage();
    navigate('/library?page=2&auth=login#top');

    expect(authDialog().open).toBe(false);
    expect(`${location.pathname}${location.search}${location.hash}`).toBe('/library?page=2#top');
    expect(snackbarText()).toContain('You are already logged in.');
    expect(root.querySelector('.header')?.querySelector('.user-profile__name')?.textContent).toBe(
      'Alex Pro',
    );
    expect(root.querySelector('.header__login')).toBeNull();
  });

  it('logs out to Guest Mode and signs out of Firebase', async () => {
    root
      .querySelector('.header')
      ?.querySelector<HTMLButtonElement>('.user-profile__logout')
      ?.click();

    await vi.waitFor(() => {
      expect(snackbarText()).toContain('You have been logged out.');
    });
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(firebaseMocks.signOut).toHaveBeenCalled();
    expect(root.querySelector('.header__login')).not.toBeNull();
  });

  it('opens the mobile menu and Auth from it', () => {
    root.querySelector<HTMLButtonElement>('.header__burger')?.click();
    // The first menu action is Log In.
    root.querySelector<HTMLButtonElement>('.mobile-menu__button')?.click();

    expect(new URLSearchParams(location.search).get('auth')).toBe('login');
    expect(authDialog().open).toBe(true);

    authDialog().close();
  });
});
