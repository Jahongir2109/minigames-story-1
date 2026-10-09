import { FirebaseError } from 'firebase/app';
import type { Auth, UserCredential } from 'firebase/auth';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  getAuthErrorMessage,
  isAuthCancellation,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  toUserProfile,
} from './auth-service';

interface FirebaseAuthMocks {
  signInWithEmailAndPassword: Mock<(...parameters: unknown[]) => Promise<UserCredential>>;
  createUserWithEmailAndPassword: Mock<(...parameters: unknown[]) => Promise<UserCredential>>;
  updateProfile: Mock<(...parameters: unknown[]) => Promise<void>>;
  signInWithPopup: Mock<(...parameters: unknown[]) => Promise<UserCredential>>;
  GoogleAuthProvider: Mock<() => { setCustomParameters: Mock<(parameters: object) => void> }>;
}

const mocks: FirebaseAuthMocks = vi.hoisted((): FirebaseAuthMocks => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithPopup: vi.fn(),
  // A regular function, so the service can call it with `new`.
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider(): {
    setCustomParameters: Mock<(parameters: object) => void>;
  } {
    return { setCustomParameters: vi.fn() };
  }),
}));

vi.mock('firebase/auth', () => mocks);

const AUTH: Auth = { name: 'auth' } as unknown as Auth;

function credential(user: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): UserCredential {
  return { user } as unknown as UserCredential;
}

beforeEach(() => {
  mocks.signInWithEmailAndPassword.mockReset();
  mocks.createUserWithEmailAndPassword.mockReset();
  mocks.updateProfile.mockReset().mockResolvedValue();
});

describe('toUserProfile', () => {
  it('keeps the name, email and photo only', () => {
    expect(
      toUserProfile({
        displayName: ' Cozy Gamer ',
        email: 'cozy@minigames.com',
        photoURL: 'https://img/p.png',
      }),
    ).toEqual({
      displayName: 'Cozy Gamer',
      email: 'cozy@minigames.com',
      avatarUrl: 'https://img/p.png',
    });
  });

  it('uses empty values and no avatar when Firebase has none', () => {
    expect(toUserProfile({ displayName: null, email: null, photoURL: null })).toEqual({
      displayName: '',
      email: '',
    });
    expect(toUserProfile({ displayName: 'A', email: 'a@b.co', photoURL: '' })).not.toHaveProperty(
      'avatarUrl',
    );
  });
});

describe('signInWithEmail', () => {
  it('signs in with the trimmed email and the password', async () => {
    mocks.signInWithEmailAndPassword.mockResolvedValue(
      credential({ displayName: 'Cozy', email: 'cozy@minigames.com', photoURL: null }),
    );

    await expect(
      signInWithEmail(AUTH, { kind: 'login', email: ' cozy@minigames.com ', password: 'secret' }),
    ).resolves.toEqual({ displayName: 'Cozy', email: 'cozy@minigames.com' });
    expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      AUTH,
      'cozy@minigames.com',
      'secret',
    );
  });

  it('passes Firebase errors on', async () => {
    mocks.signInWithEmailAndPassword.mockRejectedValue(
      new FirebaseError('auth/invalid-credential', 'bad'),
    );

    await expect(
      signInWithEmail(AUTH, { kind: 'login', email: 'a@b.co', password: 'secret' }),
    ).rejects.toBeInstanceOf(FirebaseError);
  });
});

describe('registerWithEmail', () => {
  it('creates the account and saves the username as displayName', async () => {
    const user: { displayName: null; email: string; photoURL: null } = {
      displayName: null,
      email: 'cozy@minigames.com',
      photoURL: null,
    };

    mocks.createUserWithEmailAndPassword.mockResolvedValue(credential(user));

    await expect(
      registerWithEmail(AUTH, {
        kind: 'register',
        username: 'CozyGamer99',
        email: 'cozy@minigames.com ',
        password: 'Secret1!',
      }),
    ).resolves.toEqual({ displayName: 'CozyGamer99', email: 'cozy@minigames.com' });
    expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      AUTH,
      'cozy@minigames.com',
      'Secret1!',
    );
    expect(mocks.updateProfile).toHaveBeenCalledWith(user, { displayName: 'CozyGamer99' });
  });

  it('fails when the profile cannot be saved', async () => {
    mocks.createUserWithEmailAndPassword.mockResolvedValue(
      credential({ displayName: null, email: 'a@b.co', photoURL: null }),
    );
    mocks.updateProfile.mockRejectedValue(new FirebaseError('auth/network-request-failed', ''));

    await expect(
      registerWithEmail(AUTH, {
        kind: 'register',
        username: 'Cozy',
        email: 'a@b.co',
        password: 'Secret1!',
      }),
    ).rejects.toBeInstanceOf(FirebaseError);
  });
});

describe('signInWithGoogle', () => {
  it('signs in with a Google pop-up that lets the user pick an account', async () => {
    mocks.signInWithPopup.mockResolvedValue(
      credential({
        displayName: 'Alex Pro',
        email: 'alex@gmail.com',
        photoURL: 'https://lh3/photo.jpg',
      }),
    );

    await expect(signInWithGoogle(AUTH)).resolves.toEqual({
      displayName: 'Alex Pro',
      email: 'alex@gmail.com',
      avatarUrl: 'https://lh3/photo.jpg',
    });

    const provider: unknown = mocks.GoogleAuthProvider.mock.results[0]?.value;

    expect(mocks.signInWithPopup).toHaveBeenCalledWith(AUTH, provider);
    expect(
      (provider as { setCustomParameters: Mock<(parameters: object) => void> }).setCustomParameters,
    ).toHaveBeenCalledWith({ prompt: 'select_account' });
  });

  it('passes a closed pop-up on as a cancellation', async () => {
    mocks.signInWithPopup.mockRejectedValue(new FirebaseError('auth/popup-closed-by-user', ''));

    await expect(signInWithGoogle(AUTH)).rejects.toSatisfy(isAuthCancellation);
  });
});

describe('isAuthCancellation', () => {
  it('recognizes only the cancelled pop-up codes', () => {
    expect(isAuthCancellation(new FirebaseError('auth/cancelled-popup-request', ''))).toBe(true);
    expect(isAuthCancellation(new FirebaseError('auth/popup-blocked', ''))).toBe(false);
    expect(isAuthCancellation(new Error('auth/popup-closed-by-user'))).toBe(false);
  });
});

describe('getAuthErrorMessage', () => {
  it('explains known Firebase errors', () => {
    expect(getAuthErrorMessage(new FirebaseError('auth/invalid-credential', ''))).toBe(
      'Wrong email or password.',
    );
    expect(getAuthErrorMessage(new FirebaseError('auth/email-already-in-use', ''))).toMatch(
      /already exists/,
    );
    expect(getAuthErrorMessage(new FirebaseError('auth/popup-closed-by-user', ''))).toMatch(
      /cancelled/,
    );
  });

  it('falls back for unknown errors', () => {
    expect(getAuthErrorMessage(new FirebaseError('auth/something-new', ''))).toBe(
      'Authentication failed. Please try again.',
    );
    expect(getAuthErrorMessage(new Error('boom'))).toBe(
      'Something unexpected happened. Please try again.',
    );
  });
});
