import { inject, Injectable } from '@angular/core';
import type { Auth, GoogleAuthProvider, User, UserCredential } from 'firebase/auth';

import { FirebaseAuth } from './firebase';
import type { UserProfile } from './session';

export interface LoginRequest {
  kind: 'login';
  email: string;
  password: string;
}

export interface RegisterRequest {
  kind: 'register';
  username: string;
  email: string;
  password: string;
}

export interface GoogleRequest {
  kind: 'google';
}

export type AuthRequest = LoginRequest | RegisterRequest | GoogleRequest;

/**
 * The part of the Firebase user that the app session keeps (no tokens).
 */
export function toUserProfile(user: Pick<User, 'displayName' | 'email' | 'photoURL'>): UserProfile {
  const profile: UserProfile = {
    displayName: user.displayName?.trim() ?? '',
    email: user.email ?? '',
  };

  if (user.photoURL !== null && user.photoURL !== '') {
    profile.avatarUrl = user.photoURL;
  }

  return profile;
}

function readCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

const CANCELLATION_CODES: ReadonlySet<string> = new Set<string>([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

/**
 * The user closed or cancelled the Google window: not an error, just no sign-in.
 */
export function isAuthCancellation(error: unknown): boolean {
  return CANCELLATION_CODES.has(readCode(error) ?? '');
}

// Firebase error code -> translation key of a readable message.
const ERROR_KEYS: Readonly<Record<string, string>> = {
  'auth/invalid-credential': 'auth.errors.wrongCredentials',
  'auth/invalid-login-credentials': 'auth.errors.wrongCredentials',
  'auth/wrong-password': 'auth.errors.wrongCredentials',
  'auth/user-not-found': 'auth.errors.wrongCredentials',
  'auth/invalid-email': 'auth.errors.invalidEmail',
  'auth/user-disabled': 'auth.errors.disabled',
  'auth/email-already-in-use': 'auth.errors.emailInUse',
  'auth/weak-password': 'auth.errors.weakPassword',
  'auth/too-many-requests': 'auth.errors.tooManyRequests',
  'auth/network-request-failed': 'errors.network',
  'auth/popup-blocked': 'auth.errors.popupBlocked',
  'auth/popup-closed-by-user': 'auth.errors.cancelled',
  'auth/cancelled-popup-request': 'auth.errors.cancelled',
  'auth/user-cancelled': 'auth.errors.cancelled',
  'auth/account-exists-with-different-credential': 'auth.errors.differentCredential',
  'auth/unauthorized-domain': 'auth.errors.unauthorizedDomain',
  'auth/operation-not-allowed': 'auth.errors.notAllowed',
};

/**
 * Translation key of a readable message for a failed sign-in or registration.
 */
export function getAuthErrorKey(error: unknown): string {
  const code: string | undefined = readCode(error);

  return code === undefined ? 'errors.unexpected' : (ERROR_KEYS[code] ?? 'auth.errors.failed');
}

/**
 * Signs in with Firebase (email / password or a Google pop-up) and creates accounts. Only the
 * profile is returned; the app session is kept by the Session service.
 */
@Injectable({ providedIn: 'root' })
export class Authenticator {
  private readonly firebase: FirebaseAuth = inject(FirebaseAuth);

  async signIn(request: AuthRequest): Promise<UserProfile> {
    const auth: Auth = await this.firebase.get();
    const {
      createUserWithEmailAndPassword,
      GoogleAuthProvider,
      signInWithEmailAndPassword,
      signInWithPopup,
      updateProfile,
    } = await import('firebase/auth');

    switch (request.kind) {
      case 'login': {
        const credential: UserCredential = await signInWithEmailAndPassword(
          auth,
          request.email.trim(),
          request.password,
        );

        return toUserProfile(credential.user);
      }
      case 'register': {
        const credential: UserCredential = await createUserWithEmailAndPassword(
          auth,
          request.email.trim(),
          request.password,
        );

        // The username becomes the Firebase display name.
        await updateProfile(credential.user, { displayName: request.username });

        return { ...toUserProfile(credential.user), displayName: request.username };
      }
      case 'google': {
        const provider: GoogleAuthProvider = new GoogleAuthProvider();

        provider.setCustomParameters({ prompt: 'select_account' });

        const credential: UserCredential = await signInWithPopup(auth, provider);

        return toUserProfile(credential.user);
      }
    }
  }

  async signOut(): Promise<void> {
    const auth: Auth = await this.firebase.get();
    const { signOut } = await import('firebase/auth');

    await signOut(auth);
  }
}
