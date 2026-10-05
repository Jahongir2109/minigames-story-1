import { showSnackbar } from '@/components/ui/snackbar/snackbar';

import {
  type AuthRequest,
  getAuthErrorMessage,
  isAuthCancellation,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from './auth-service';
import { getFirebaseAuth } from './firebase';
import type { SessionStore, UserProfile } from './session';

async function signIn(request: AuthRequest): Promise<UserProfile> {
  switch (request.kind) {
    case 'login': {
      return signInWithEmail(getFirebaseAuth(), request);
    }
    case 'register': {
      return registerWithEmail(getFirebaseAuth(), request);
    }
    case 'google': {
      return signInWithGoogle(getFirebaseAuth());
    }
  }
}

const SUCCESS_MESSAGES: Readonly<Record<AuthRequest['kind'], string>> = {
  login: 'Welcome back!',
  register: 'Your account is ready. Welcome!',
  google: 'Signed in with Google. Welcome!',
};

/**
 * Signs in with Firebase, then starts the app session. Resolves `true` on success; failures (and a
 * cancelled Google window) are reported with a Snackbar and leave the dialog open for a retry.
 */
export async function didAuthenticate(
  session: SessionStore,
  request: AuthRequest,
): Promise<boolean> {
  try {
    session.start(await signIn(request));
    showSnackbar({ message: SUCCESS_MESSAGES[request.kind], variant: 'success' });

    return true;
  } catch (error: unknown) {
    showSnackbar({
      message: getAuthErrorMessage(error),
      variant: isAuthCancellation(error) ? 'info' : 'error',
    });

    return false;
  }
}
