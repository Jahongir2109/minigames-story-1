import type { AppSession, SessionStore } from './session';

export interface SessionGuardOptions {
  store: SessionStore;
  /**
   * Shows Auth instead of the current view (the view itself stays in the URL).
   */
  onAuthRequired: () => void;
  /**
   * Tells a guest why the action needs an account.
   */
  warn: (message: string) => void;
}

/**
 * Returns the valid session before a protected action (favorite, comment, like), or `undefined`
 * when the action must not be sent. `warning` is shown to a guest.
 */
export type RequireSession = (warning: string) => AppSession | undefined;

/**
 * Guards the protected actions with the app session. Without a valid session the request is not
 * sent and Auth opens; the action is not repeated after the sign-in. A session that expires right
 * now has already shown its own Snackbar, so only guests get the warning.
 */
export function createSessionGuard(options: SessionGuardOptions): RequireSession {
  return (warning: string): AppSession | undefined => {
    // The store notifies `undefined` only when an active session ends during this check.
    const changes: (AppSession | undefined)[] = [];
    const unsubscribe: () => void = options.store.subscribe(
      (session: AppSession | undefined): void => {
        changes.push(session);
      },
    );
    const session: AppSession | undefined = options.store.check();

    unsubscribe();

    if (session !== undefined) {
      return session;
    }

    if (!changes.includes(undefined)) {
      options.warn(warning);
    }

    options.onAuthRequired();

    return undefined;
  };
}
