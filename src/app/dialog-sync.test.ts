import { afterAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AppSession } from '@/auth/session';

import { createDialogSync, isAuthMode } from './dialog-sync';
import { onLocationChange } from './navigation';

const SESSION: AppSession = { displayName: 'Alex', email: 'a@b.co', authenticatedAt: 1 };

interface Fakes {
  authDialog: { open: Mock<(mode: string) => void>; close: Mock<() => void> };
  gameDialog: {
    open: Mock<(slug: string) => void>;
    hide: Mock<(slug: string) => void>;
    close: Mock<() => void>;
  };
  check: Mock<() => AppSession | undefined>;
  onAlreadyAuthenticated: Mock<() => void>;
  sync: () => void;
}

function setup(session?: AppSession): Fakes {
  const fakes: Omit<Fakes, 'sync'> = {
    authDialog: { open: vi.fn(), close: vi.fn() },
    gameDialog: { open: vi.fn(), hide: vi.fn(), close: vi.fn() },
    check: vi.fn((): AppSession | undefined => session),
    onAlreadyAuthenticated: vi.fn(),
  };
  const sync: () => void = createDialogSync({
    authDialog: fakes.authDialog,
    gameDialog: fakes.gameDialog,
    session: { check: fakes.check },
    onAlreadyAuthenticated: fakes.onAlreadyAuthenticated,
  });

  return { ...fakes, sync };
}

function visit(url: string): void {
  history.replaceState(null, '', url);
}

// Every URL change made by the sync itself (removing `auth`) is counted here.
const locationListener: Mock<() => void> = vi.fn();
const stopListening: () => void = onLocationChange(locationListener);

beforeEach(() => {
  locationListener.mockClear();
});

afterAll(() => {
  stopListening();
});

describe('isAuthMode', () => {
  it('accepts only the two auth modes', () => {
    expect(isAuthMode('login')).toBe(true);
    expect(isAuthMode('register')).toBe(true);
    expect(isAuthMode('admin')).toBe(false);
    expect(isAuthMode(undefined)).toBe(false);
  });
});

describe('createDialogSync', () => {
  it('closes both dialogs for a plain page', () => {
    const fakes: Fakes = setup();

    visit('/library');
    fakes.sync();

    expect(fakes.authDialog.close).toHaveBeenCalledTimes(1);
    expect(fakes.gameDialog.close).toHaveBeenCalledTimes(1);
    expect(fakes.authDialog.open).not.toHaveBeenCalled();
  });

  it('opens Game Details from the URL', () => {
    const fakes: Fakes = setup();

    visit('/library?game=tukoni');
    fakes.sync();

    expect(fakes.gameDialog.open).toHaveBeenCalledWith('tukoni');
    expect(fakes.authDialog.close).toHaveBeenCalled();
  });

  it('opens Auth for a guest', () => {
    const fakes: Fakes = setup();

    visit('/?auth=register');
    fakes.sync();

    expect(fakes.authDialog.open).toHaveBeenCalledWith('register');
    expect(fakes.onAlreadyAuthenticated).not.toHaveBeenCalled();
  });

  it('ignores an unknown auth mode', () => {
    const fakes: Fakes = setup();

    visit('/?auth=admin');
    fakes.sync();

    expect(fakes.authDialog.open).not.toHaveBeenCalled();
    expect(fakes.check).not.toHaveBeenCalled();
  });

  it('shows Auth instead of Game Details and keeps the game', () => {
    const fakes: Fakes = setup();

    visit('/library?game=tukoni&auth=login');
    fakes.sync();

    expect(fakes.gameDialog.hide).toHaveBeenCalledWith('tukoni');
    expect(fakes.gameDialog.open).not.toHaveBeenCalled();
    expect(fakes.authDialog.open).toHaveBeenCalledWith('login');
  });

  it('blocks Auth for a signed-in user and cleans only the auth parameter', () => {
    const fakes: Fakes = setup(SESSION);
    const length: number = history.length;

    visit('/library?page=2&auth=login#top');
    fakes.sync();

    expect(fakes.authDialog.open).not.toHaveBeenCalled();
    expect(fakes.onAlreadyAuthenticated).toHaveBeenCalledTimes(1);
    expect(`${location.pathname}${location.search}${location.hash}`).toBe('/library?page=2#top');
    expect(history.length).toBe(length);
    expect(locationListener).toHaveBeenCalledTimes(1);
  });

  it('keeps Game Details open when a signed-in user lands on Auth over it', () => {
    const fakes: Fakes = setup(SESSION);

    visit('/?game=tukoni&auth=login');
    fakes.sync();

    expect(location.search).toBe('?game=tukoni');
    expect(fakes.gameDialog.hide).not.toHaveBeenCalled();
  });
});
