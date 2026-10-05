import { FirebaseError } from 'firebase/app';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AuthRequest } from './auth-service';
import { didAuthenticate } from './authenticate';
import type { SessionStore, UserProfile } from './session';

interface Mocks {
  signInWithEmail: Mock<(auth: unknown, request: AuthRequest) => Promise<UserProfile>>;
  registerWithEmail: Mock<(auth: unknown, request: AuthRequest) => Promise<UserProfile>>;
  signInWithGoogle: Mock<(auth: unknown) => Promise<UserProfile>>;
  showSnackbar: Mock<(options: { message: string; variant?: string }) => void>;
}

const mocks: Mocks = vi.hoisted((): Mocks => ({
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('./auth-service', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  signInWithEmail: mocks.signInWithEmail,
  registerWithEmail: mocks.registerWithEmail,
  signInWithGoogle: mocks.signInWithGoogle,
}));
vi.mock('./firebase', () => ({ getFirebaseAuth: (): string => 'auth' }));
vi.mock('@/components/ui/snackbar/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const PROFILE: UserProfile = { displayName: 'Cozy', email: 'cozy@minigames.com' };

function createSession(): SessionStore & { start: Mock<SessionStore['start']> } {
  return {
    check: vi.fn(),
    start: vi.fn((profile: UserProfile) => ({ ...profile, authenticatedAt: 1 })),
    end: vi.fn(),
    subscribe: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('didAuthenticate', () => {
  it('logs in with email and starts the session', async () => {
    const session: SessionStore & { start: Mock<SessionStore['start']> } = createSession();
    const request: AuthRequest = { kind: 'login', email: 'cozy@minigames.com', password: 'x' };

    mocks.signInWithEmail.mockResolvedValue(PROFILE);

    await expect(didAuthenticate(session, request)).resolves.toBe(true);
    expect(mocks.signInWithEmail).toHaveBeenCalledWith('auth', request);
    expect(session.start).toHaveBeenCalledWith(PROFILE);
    expect(mocks.showSnackbar).toHaveBeenCalledWith({
      message: 'Welcome back!',
      variant: 'success',
    });
  });

  it('registers with email and starts the session', async () => {
    const session: SessionStore & { start: Mock<SessionStore['start']> } = createSession();

    mocks.registerWithEmail.mockResolvedValue(PROFILE);

    await expect(
      didAuthenticate(session, {
        kind: 'register',
        username: 'Cozy',
        email: 'cozy@minigames.com',
        password: 'Secret1!',
      }),
    ).resolves.toBe(true);
    expect(session.start).toHaveBeenCalledWith(PROFILE);
  });

  it('signs in with Google and starts the same session', async () => {
    const session: SessionStore & { start: Mock<SessionStore['start']> } = createSession();

    mocks.signInWithGoogle.mockResolvedValue({ ...PROFILE, avatarUrl: 'https://img' });

    await expect(didAuthenticate(session, { kind: 'google' })).resolves.toBe(true);
    expect(session.start).toHaveBeenCalledWith({ ...PROFILE, avatarUrl: 'https://img' });
  });

  it('reports a failure and does not start a session', async () => {
    const session: SessionStore & { start: Mock<SessionStore['start']> } = createSession();

    mocks.signInWithEmail.mockRejectedValue(new FirebaseError('auth/invalid-credential', ''));

    await expect(
      didAuthenticate(session, { kind: 'login', email: 'a@b.co', password: 'wrong1' }),
    ).resolves.toBe(false);
    expect(session.start).not.toHaveBeenCalled();
    expect(mocks.showSnackbar).toHaveBeenCalledWith({
      message: 'Wrong email or password.',
      variant: 'error',
    });
  });

  it('treats a closed Google window as a cancellation, not an error', async () => {
    const session: SessionStore & { start: Mock<SessionStore['start']> } = createSession();

    mocks.signInWithGoogle.mockRejectedValue(new FirebaseError('auth/popup-closed-by-user', ''));

    await expect(didAuthenticate(session, { kind: 'google' })).resolves.toBe(false);
    expect(session.start).not.toHaveBeenCalled();
    expect(mocks.showSnackbar).toHaveBeenCalledWith({
      message: 'Google sign-in was cancelled.',
      variant: 'info',
    });
  });
});
