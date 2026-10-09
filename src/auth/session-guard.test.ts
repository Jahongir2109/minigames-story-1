import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  type AppSession,
  createSessionStore,
  SESSION_LIFETIME_MS,
  SESSION_STORAGE_KEY,
  type SessionStore,
} from './session';
import { createSessionGuard, type RequireSession } from './session-guard';

const START: number = Date.UTC(2026, 9, 5, 12);
const PROFILE: { displayName: string; email: string } = {
  displayName: 'Alex',
  email: 'alex@minigames.com',
};
const WARNING: string = 'Log in to add games to your favorites.';

interface Setup {
  store: SessionStore;
  requireSession: RequireSession;
  onAuthRequired: Mock<() => void>;
  warn: Mock<(message: string) => void>;
  onExpire: Mock<() => void>;
}

function setup(): Setup {
  const onExpire: Mock<() => void> = vi.fn();
  const store: SessionStore = createSessionStore({
    storage: localStorage,
    signOut: (): Promise<void> => Promise.resolve(),
    onExpire,
  });
  const onAuthRequired: Mock<() => void> = vi.fn();
  const warn: Mock<(message: string) => void> = vi.fn();

  return {
    store,
    requireSession: createSessionGuard({ store, onAuthRequired, warn }),
    onAuthRequired,
    warn,
    onExpire,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSessionGuard', () => {
  it('lets a signed-in user through', () => {
    const { store, requireSession, onAuthRequired, warn } = setup();
    const session: AppSession = store.start(PROFILE);

    expect(requireSession(WARNING)).toEqual(session);
    expect(onAuthRequired).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns a guest and asks for authentication', () => {
    const { requireSession, onAuthRequired, warn } = setup();

    expect(requireSession(WARNING)).toBeUndefined();
    expect(warn).toHaveBeenCalledExactlyOnceWith(WARNING);
    expect(onAuthRequired).toHaveBeenCalledTimes(1);
  });

  it('shows only the expiry notice when the session ran out before the action', () => {
    const { store, requireSession, onAuthRequired, warn, onExpire } = setup();

    store.start(PROFILE);
    // The stored sign-in time was moved back (e.g. by a reviewer in DevTools).
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...PROFILE, authenticatedAt: START - SESSION_LIFETIME_MS }),
    );

    expect(requireSession(WARNING)).toBeUndefined();
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    expect(onAuthRequired).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('treats a user whose session already expired as a guest', () => {
    const { store, requireSession, warn } = setup();

    store.start(PROFILE);
    vi.advanceTimersByTime(SESSION_LIFETIME_MS);

    expect(requireSession(WARNING)).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
