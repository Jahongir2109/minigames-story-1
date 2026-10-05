/**
 * The app session: whether the UI treats the user as signed in. Firebase only proves the identity;
 * the session lives in localStorage for a fixed 5 minutes from the sign-in (using the app or
 * reloading the page does not extend it). It never holds passwords or Firebase tokens.
 */
export const SESSION_STORAGE_KEY: string = 'minigames:jahongir2109-minigames:app-session';
export const SESSION_LIFETIME_MS: number = 5 * 60 * 1000;

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface AppSession extends UserProfile {
  /**
   * When the user signed in, in milliseconds since the epoch.
   */
  authenticatedAt: number;
}

export type SessionListener = (session: AppSession | undefined) => void;

export interface SessionStoreOptions {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  /**
   * Ends the Firebase sign-in too, so Firebase cannot restore the user on its own.
   */
  signOut: () => Promise<void>;
  /**
   * Called once when an active session runs out (e.g. to show a Snackbar).
   */
  onExpire?: () => void;
  now?: () => number;
}

export interface SessionStore {
  /**
   * The valid session, or `undefined` for a guest. An expired or broken stored session is removed
   * on the way (used on startup, page reactivation, navigation and before protected actions).
   */
  check: () => AppSession | undefined;
  /**
   * Starts a new session after a successful sign-in.
   */
  start: (profile: UserProfile) => AppSession;
  /**
   * Logout: removes the session and signs out of Firebase. Rejects when the Firebase sign-out
   * fails; the app stays in Guest Mode anyway.
   */
  end: () => Promise<void>;
  subscribe: (listener: SessionListener) => () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads a stored session; `undefined` when the value is not valid JSON or a field is missing or of
 * the wrong type.
 */
export function parseSession(raw: string): AppSession | undefined {
  let value: unknown;

  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (
    !isRecord(value) ||
    typeof value.displayName !== 'string' ||
    typeof value.email !== 'string' ||
    typeof value.authenticatedAt !== 'number' ||
    !Number.isFinite(value.authenticatedAt) ||
    (value.avatarUrl !== undefined && typeof value.avatarUrl !== 'string')
  ) {
    return undefined;
  }

  const session: AppSession = {
    displayName: value.displayName,
    email: value.email,
    authenticatedAt: value.authenticatedAt,
  };

  if (typeof value.avatarUrl === 'string') {
    session.avatarUrl = value.avatarUrl;
  }

  return session;
}

export function isSessionExpired(session: AppSession, now: number): boolean {
  // A sign-in time in the future cannot be real, so such a session is not trusted either.
  return now - session.authenticatedAt >= SESSION_LIFETIME_MS || session.authenticatedAt > now;
}

export function createSessionStore(options: SessionStoreOptions): SessionStore {
  const now: () => number = options.now ?? Date.now;
  const listeners: Set<SessionListener> = new Set<SessionListener>();
  let current: AppSession | undefined;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  const notify = (): void => {
    for (const listener of listeners) {
      listener(current);
    }
  };

  // Firebase errors must not break the switch to Guest Mode.
  const signOutQuietly = async (): Promise<void> => {
    try {
      await options.signOut();
    } catch {
      // The app session is already gone, so the UI is in Guest Mode either way.
    }
  };

  const clearTimer = (): void => {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
  };

  const check = (): AppSession | undefined => {
    const raw: string | null = options.storage.getItem(SESSION_STORAGE_KEY);
    const wasActive: boolean = current !== undefined;

    if (raw === null) {
      if (wasActive) {
        clearTimer();
        current = undefined;
        notify();
      }

      return undefined;
    }

    const session: AppSession | undefined = parseSession(raw);

    if (session !== undefined && !isSessionExpired(session, now())) {
      const isNew: boolean = current?.authenticatedAt !== session.authenticatedAt;

      current = session;

      if (isNew) {
        scheduleExpiry(session);
        notify();
      }

      return session;
    }

    options.storage.removeItem(SESSION_STORAGE_KEY);
    clearTimer();
    void signOutQuietly();
    current = undefined;

    // Only a session that the user had (or restored from a valid value) "expires".
    if (session !== undefined || wasActive) {
      options.onExpire?.();
    }

    if (wasActive) {
      notify();
    }

    return undefined;
  };

  // The UI switches to Guest Mode right when the 5 minutes are over, even without user actions.
  function scheduleExpiry(session: AppSession): void {
    clearTimer();
    expiryTimer = setTimeout(
      check,
      Math.max(0, session.authenticatedAt + SESSION_LIFETIME_MS - now()),
    );
  }

  const start = (profile: UserProfile): AppSession => {
    const session: AppSession = { ...profile, authenticatedAt: now() };

    options.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    current = session;
    scheduleExpiry(session);
    notify();

    return session;
  };

  const end = async (): Promise<void> => {
    options.storage.removeItem(SESSION_STORAGE_KEY);
    clearTimer();

    const wasActive: boolean = current !== undefined;

    current = undefined;

    if (wasActive) {
      notify();
    }

    await options.signOut();
  };

  const subscribe = (listener: SessionListener): (() => void) => {
    listeners.add(listener);

    return (): void => {
      listeners.delete(listener);
    };
  };

  return { check, start, end, subscribe };
}
