import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { navigate } from '@/app/navigation';

import { createAppSessionStore, SESSION_EXPIRED_MESSAGE, watchSession } from './app-session';
import { SESSION_LIFETIME_MS, SESSION_STORAGE_KEY, type SessionStore } from './session';

interface Mocks {
  signOut: Mock<(auth: unknown) => Promise<void>>;
  getFirebaseAuth: Mock<() => { kind: string }>;
  showSnackbar: Mock<(options: { message: string; variant?: string }) => void>;
}

const mocks: Mocks = vi.hoisted((): Mocks => ({
  signOut: vi.fn((): Promise<void> => Promise.resolve()),
  getFirebaseAuth: vi.fn((): { kind: string } => ({ kind: 'auth' })),
  showSnackbar: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ signOut: mocks.signOut }));
vi.mock('./firebase', () => ({ getFirebaseAuth: mocks.getFirebaseAuth }));
vi.mock('@/components/ui/snackbar/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const START: number = Date.UTC(2026, 9, 5, 12);

function storeSession(authenticatedAt: number): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ displayName: 'Cozy', email: 'cozy@minigames.com', authenticatedAt }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  localStorage.clear();
  mocks.signOut.mockClear();
  mocks.showSnackbar.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createAppSessionStore', () => {
  it('keeps the session in localStorage', () => {
    const store: SessionStore = createAppSessionStore();

    store.start({ displayName: 'Cozy', email: 'cozy@minigames.com' });

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toContain('"authenticatedAt":');
  });

  it('signs out of Firebase and shows one Snackbar when the session expires', () => {
    const store: SessionStore = createAppSessionStore();

    store.start({ displayName: 'Cozy', email: 'cozy@minigames.com' });
    vi.advanceTimersByTime(SESSION_LIFETIME_MS);

    expect(mocks.signOut).toHaveBeenCalledWith({ kind: 'auth' });
    expect(mocks.showSnackbar).toHaveBeenCalledExactlyOnceWith({
      message: SESSION_EXPIRED_MESSAGE,
      variant: 'info',
    });
  });
});

describe('watchSession', () => {
  it('checks the session on startup', () => {
    storeSession(START - SESSION_LIFETIME_MS);

    watchSession(createAppSessionStore());

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
  });

  it('checks the session again when the page becomes visible', () => {
    const store: SessionStore = createAppSessionStore();
    const check: Mock<SessionStore['check']> = vi.spyOn(store, 'check');

    watchSession(store);
    check.mockClear();
    document.dispatchEvent(new Event('visibilitychange'));
    dispatchEvent(new Event('pageshow'));

    expect(check).toHaveBeenCalledTimes(2);
  });

  it('checks the session on navigation', () => {
    const store: SessionStore = createAppSessionStore();
    const check: Mock<SessionStore['check']> = vi.spyOn(store, 'check');

    watchSession(store);
    check.mockClear();
    navigate('/library?watch-session-test=1');
    dispatchEvent(new PopStateEvent('popstate'));

    expect(check).toHaveBeenCalledTimes(2);
  });
});
