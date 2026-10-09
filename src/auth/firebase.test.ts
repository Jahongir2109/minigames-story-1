import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type * as FirebaseModule from './firebase';
import type { EnvironmentVariables } from './firebase';

interface FirebaseMocks {
  initializeApp: Mock<() => { name: string }>;
  getAuth: Mock<() => { kind: string }>;
}

const firebaseMocks: FirebaseMocks = vi.hoisted((): FirebaseMocks => ({
  initializeApp: vi.fn((): { name: string } => ({ name: '[DEFAULT]' })),
  getAuth: vi.fn((): { kind: string } => ({ kind: 'auth' })),
}));

vi.mock('firebase/app', () => ({ initializeApp: firebaseMocks.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: firebaseMocks.getAuth }));

const ENV: EnvironmentVariables = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};

// The module caches the Auth instance, so every test starts from a fresh copy.
async function loadModule(): Promise<typeof FirebaseModule> {
  vi.resetModules();

  return import('./firebase');
}

beforeEach(() => {
  firebaseMocks.initializeApp.mockClear();
  firebaseMocks.getAuth.mockClear();
});

describe('readFirebaseConfig', () => {
  it('maps the env variables to the Firebase options', async () => {
    const { readFirebaseConfig } = await loadModule();

    expect(readFirebaseConfig(ENV)).toEqual({
      apiKey: 'key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo',
      storageBucket: 'demo.firebasestorage.app',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    });
  });

  it('names the missing or empty variable', async () => {
    const { readFirebaseConfig } = await loadModule();

    expect(() => readFirebaseConfig({ ...ENV, VITE_FIREBASE_APP_ID: undefined })).toThrow(
      'VITE_FIREBASE_APP_ID is missing',
    );
    expect(() => readFirebaseConfig({ ...ENV, VITE_FIREBASE_API_KEY: '  ' })).toThrow(
      'VITE_FIREBASE_API_KEY is missing',
    );
  });
});

describe('getFirebaseAuth', () => {
  it('initializes the app with the config once and reuses the Auth instance', async () => {
    const { getFirebaseAuth } = await loadModule();

    const first: unknown = getFirebaseAuth(ENV);
    const second: unknown = getFirebaseAuth(ENV);

    expect(first).toBe(second);
    expect(firebaseMocks.initializeApp).toHaveBeenCalledTimes(1);
    expect(firebaseMocks.initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'demo', apiKey: 'key' }),
    );
    expect(firebaseMocks.getAuth).toHaveBeenCalledWith({ name: '[DEFAULT]' });
  });

  it('does not initialize Firebase when the config is incomplete', async () => {
    const { getFirebaseAuth } = await loadModule();

    expect(() => getFirebaseAuth({})).toThrow('is missing');
    expect(firebaseMocks.initializeApp).not.toHaveBeenCalled();
  });
});
