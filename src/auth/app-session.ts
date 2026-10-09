import { signOut } from 'firebase/auth';

import { onLocationChange } from '@/app/navigation';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';

import { getFirebaseAuth } from './firebase';
import { createSessionStore, type SessionStore } from './session';

export const SESSION_EXPIRED_MESSAGE: string =
  'Your session has expired. You are browsing as a guest now.';

/**
 * The session store of the app: kept in localStorage, ends the Firebase sign-in with it and
 * tells the user once when the 5 minutes are over.
 */
export function createAppSessionStore(): SessionStore {
  return createSessionStore({
    storage: localStorage,
    signOut: (): Promise<void> => signOut(getFirebaseAuth()),
    onExpire: (): void => {
      showSnackbar({ message: SESSION_EXPIRED_MESSAGE, variant: 'info' });
    },
  });
}

/**
 * Checks the session on startup, when the page becomes visible again and on every navigation
 * (links, Back / Forward), so an expired session never survives into the next screen.
 */
export function watchSession(store: SessionStore): void {
  store.check();

  document.addEventListener('visibilitychange', (): void => {
    if (document.visibilityState === 'visible') {
      store.check();
    }
  });
  addEventListener('pageshow', (): void => {
    store.check();
  });
  onLocationChange((): void => {
    store.check();
  });
}
