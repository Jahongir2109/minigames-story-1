import { FirebaseError } from 'firebase/app';
import type { Auth, UserCredential } from 'firebase/auth';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  getAuthErrorMessage,
  registerWithEmail,
  signInWithEmail,
  toUserProfile,
} from './auth-service';

interface FirebaseAuthMocks {
  signInWithEmailAndPassword: Mock<(...parameters: unknown[]) => Promise<UserCredential>>;
  createUserWithEmailAndPassword: Mock<(...parameters: unknown[]) => Promise<UserCredential>>;
  updateProfile: Mock<(...parameters: unknown[]) => Promise<void>>;
}

const mocks: FirebaseAuthMocks = vi.hoisted((): FirebaseAuthMocks => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
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
