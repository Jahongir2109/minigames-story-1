import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  type AppSession,
  createSessionStore,
  isSessionExpired,
  parseSession,
  SESSION_LIFETIME_MS,
  SESSION_STORAGE_KEY,
  type SessionStore,
  type SessionStoreOptions,
} from './session';

const START: number = Date.UTC(2026, 9, 5, 12);
const PROFILE: { displayName: string; email: string } = {
  displayName: 'CozyGamer99',
  email: 'cozy@minigames.com',
};

interface Setup {
  store: SessionStore;
  storage: Storage;
  signOut: Mock<() => Promise<void>>;
  onExpire: Mock<() => void>;
}

function setup(
  signOut: Mock<() => Promise<void>> = vi.fn((): Promise<void> => Promise.resolve()),
): Setup {
  const onExpire: Mock<() => void> = vi.fn();
  const options: SessionStoreOptions = {
    storage: localStorage,
    signOut,
    onExpire,
    now: (): number => Date.now(),
  };

  return { store: createSessionStore(options), storage: localStorage, signOut, onExpire };
}

function storeRaw(value: string): void {
  localStorage.setItem(SESSION_STORAGE_KEY, value);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('parseSession', () => {
  it('reads a complete session', () => {
    const session: AppSession = {
      ...PROFILE,
      authenticatedAt: START,
      avatarUrl: 'https://a/b.png',
    };

    expect(parseSession(JSON.stringify(session))).toEqual(session);
  });

  it('drops unknown fields', () => {
    expect(
      parseSession(JSON.stringify({ ...PROFILE, authenticatedAt: START, token: 'secret' })),
    ).toEqual({ ...PROFILE, authenticatedAt: START });
  });

  it.each([
    ['not JSON', '{oops'],
    ['not an object', '"session"'],
    ['an array', '[]'],
    ['missing email', JSON.stringify({ displayName: 'A', authenticatedAt: START })],
    ['a string timestamp', JSON.stringify({ ...PROFILE, authenticatedAt: String(START) })],
    ['a non-finite timestamp', '{"displayName":"A","email":"a@b.co","authenticatedAt":1e999}'],
    ['a wrong avatar type', JSON.stringify({ ...PROFILE, authenticatedAt: START, avatarUrl: 1 })],
  ])('rejects %s', (_name: string, raw: string) => {
    expect(parseSession(raw)).toBeUndefined();
  });
});

describe('isSessionExpired', () => {
  const session: AppSession = { ...PROFILE, authenticatedAt: START };

  it('lasts exactly 5 minutes', () => {
    expect(isSessionExpired(session, START + SESSION_LIFETIME_MS - 1)).toBe(false);
    expect(isSessionExpired(session, START + SESSION_LIFETIME_MS)).toBe(true);
  });

  it('does not trust a sign-in time in the future', () => {
    expect(isSessionExpired(session, START - 1)).toBe(true);
  });
});

describe('createSessionStore', () => {
  it('stores only the profile and the sign-in time', () => {
    const { store } = setup();

    const session: AppSession = store.start(PROFILE);

    expect(session).toEqual({ ...PROFILE, authenticatedAt: START });
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(session);
  });

  it('treats a visitor without a stored session as a guest', () => {
    const { store, signOut, onExpire } = setup();

    expect(store.check()).toBeUndefined();
    expect(signOut).not.toHaveBeenCalled();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('restores a valid session after a reload without extending it', () => {
    storeRaw(JSON.stringify({ ...PROFILE, authenticatedAt: START }));
    vi.setSystemTime(START + 60_000);

    const { store } = setup();

    expect(store.check()).toEqual({ ...PROFILE, authenticatedAt: START });
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toMatchObject({
      authenticatedAt: START,
    });
  });

  it('removes a broken session and signs out without an expiry notice', () => {
    storeRaw('{oops');
    localStorage.setItem('other-app', 'keep');

    const { store, signOut, onExpire } = setup();

    expect(store.check()).toBeUndefined();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('expires a stored session that is too old on startup', () => {
    storeRaw(JSON.stringify({ ...PROFILE, authenticatedAt: START - SESSION_LIFETIME_MS }));

    const { store, signOut, onExpire } = setup();

    expect(store.check()).toBeUndefined();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('switches to Guest Mode by itself after 5 minutes and notifies once', () => {
    const { store, signOut, onExpire } = setup();
    const listener: Mock<(session: AppSession | undefined) => void> = vi.fn();

    store.start(PROFILE);
    store.subscribe(listener);

    vi.advanceTimersByTime(SESSION_LIFETIME_MS - 1);
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Later checks (navigation, protected actions) do not repeat the notice.
    expect(store.check()).toBeUndefined();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers about a new session and stops after unsubscribing', () => {
    const { store } = setup();
    const listener: Mock<(session: AppSession | undefined) => void> = vi.fn();
    const unsubscribe: () => void = store.subscribe(listener);

    store.start(PROFILE);
    expect(listener).toHaveBeenCalledWith({ ...PROFILE, authenticatedAt: START });

    unsubscribe();
    store.check();
    void store.end();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notices a session removed in storage', () => {
    const { store } = setup();
    const listener: Mock<(session: AppSession | undefined) => void> = vi.fn();

    store.start(PROFILE);
    store.subscribe(listener);
    localStorage.removeItem(SESSION_STORAGE_KEY);

    expect(store.check()).toBeUndefined();
    expect(listener).toHaveBeenCalledWith(undefined);
  });

  it('logs out: removes only its key, signs out and goes to Guest Mode', async () => {
    const { store, signOut, onExpire } = setup();
    const listener: Mock<(session: AppSession | undefined) => void> = vi.fn();

    localStorage.setItem('other-app', 'keep');
    store.start(PROFILE);
    store.subscribe(listener);

    await store.end();

    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(undefined);
    expect(onExpire).not.toHaveBeenCalled();
    expect(store.check()).toBeUndefined();

    // The cancelled expiry timer does not fire later.
    vi.advanceTimersByTime(SESSION_LIFETIME_MS);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('stays in Guest Mode when the Firebase sign-out fails', async () => {
    const failingSignOut: Mock<() => Promise<void>> = vi.fn((): Promise<void> =>
      Promise.reject(new Error('network')),
    );
    const { store } = setup(failingSignOut);

    store.start(PROFILE);

    await expect(store.end()).rejects.toThrow('network');
    expect(store.check()).toBeUndefined();
  });

  it('ignores a failed sign-out while expiring', () => {
    const failingSignOut: Mock<() => Promise<void>> = vi.fn((): Promise<void> =>
      Promise.reject(new Error('network')),
    );
    const { store, onExpire } = setup(failingSignOut);

    store.start(PROFILE);
    vi.advanceTimersByTime(SESSION_LIFETIME_MS);

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(failingSignOut).toHaveBeenCalledTimes(1);
  });
});
