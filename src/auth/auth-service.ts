import { FirebaseError } from 'firebase/app';
import {
  type Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';

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

export async function signInWithEmail(auth: Auth, request: LoginRequest): Promise<UserProfile> {
  const credential: UserCredential = await signInWithEmailAndPassword(
    auth,
    request.email.trim(),
    request.password,
  );

  return toUserProfile(credential.user);
}

/**
 * Creates the account and saves the username as the Firebase `displayName`.
 */
export async function registerWithEmail(
  auth: Auth,
  request: RegisterRequest,
): Promise<UserProfile> {
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    request.email.trim(),
    request.password,
  );

  await updateProfile(credential.user, { displayName: request.username });

  return { ...toUserProfile(credential.user), displayName: request.username };
}

/**
 * Signs in with a Google account in a pop-up; the Google name and photo become the profile.
 */
export async function signInWithGoogle(auth: Auth): Promise<UserProfile> {
  const provider: GoogleAuthProvider = new GoogleAuthProvider();

  provider.setCustomParameters({ prompt: 'select_account' });

  const credential: UserCredential = await signInWithPopup(auth, provider);

  return toUserProfile(credential.user);
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
  return error instanceof FirebaseError && CANCELLATION_CODES.has(error.code);
}

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-login-credentials': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists. Try to log in.',
  'auth/weak-password': 'The password is too weak.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
  'auth/popup-blocked': 'The browser blocked the Google window. Allow pop-ups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/user-cancelled': 'Google sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a password. Log in with email instead.',
  'auth/unauthorized-domain': 'Sign-in is not allowed on this domain.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
};

/**
 * A readable message for a failed sign-in or registration.
 */
export function getAuthErrorMessage(error: unknown): string {
  return error instanceof FirebaseError
    ? (ERROR_MESSAGES[error.code] ?? 'Authentication failed. Please try again.')
    : 'Something unexpected happened. Please try again.';
}
