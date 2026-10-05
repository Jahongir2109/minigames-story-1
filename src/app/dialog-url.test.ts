import { afterAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { closeDialogUrl, getDialogParameter, openDialogUrl, removeDialogUrl } from './dialog-url';
import { onLocationChange } from './navigation';

function currentUrl(): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

// Counts the URL changes that the app would react to.
const listener: Mock<() => void> = vi.fn();
const stopListening: () => void = onLocationChange(listener);

beforeEach(() => {
  history.replaceState(null, '', '/library?category=puzzle#top');
  listener.mockClear();
});

afterAll(() => {
  stopListening();
});

describe('getDialogParameter', () => {
  it('reads a dialog value and ignores an empty one', () => {
    history.replaceState(null, '', '/?game=tukoni&auth=');

    expect(getDialogParameter('game')).toBe('tukoni');
    expect(getDialogParameter('auth')).toBeUndefined();
  });
});

describe('openDialogUrl', () => {
  it('adds a history entry and keeps the page query and hash', () => {
    const length: number = history.length;

    openDialogUrl('game', 'tukoni');

    expect(currentUrl()).toBe('/library?category=puzzle&game=tukoni#top');
    expect(history.length).toBe(length + 1);
    expect(history.state).toEqual({ isDialog: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replaces the entry when the open dialog changes its value', () => {
    openDialogUrl('auth', 'login');
    const length: number = history.length;

    openDialogUrl('auth', 'register');

    expect(currentUrl()).toBe('/library?category=puzzle&auth=register#top');
    expect(history.length).toBe(length);
  });

  it('replaces one dialog with another', () => {
    openDialogUrl('game', 'tukoni');
    const length: number = history.length;

    openDialogUrl('auth', 'login');

    expect(currentUrl()).toBe('/library?category=puzzle&auth=login#top');
    expect(history.length).toBe(length);
  });

  it('stacks Auth over Game Details in a new entry', () => {
    openDialogUrl('game', 'tukoni');
    const length: number = history.length;

    openDialogUrl('auth', 'login', { stack: true });

    expect(currentUrl()).toBe('/library?category=puzzle&game=tukoni&auth=login#top');
    expect(history.length).toBe(length + 1);

    // Switching the auth mode keeps the game under it.
    openDialogUrl('auth', 'register');
    expect(currentUrl()).toBe('/library?category=puzzle&game=tukoni&auth=register#top');
  });
});

describe('removeDialogUrl', () => {
  it('removes only the dialog from the current entry', () => {
    history.replaceState(null, '', '/library?auth=login&page=2#top');
    const length: number = history.length;

    removeDialogUrl('auth');

    expect(currentUrl()).toBe('/library?page=2#top');
    expect(history.length).toBe(length);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the dialog is not in the URL', () => {
    removeDialogUrl('auth');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('closeDialogUrl', () => {
  it('goes back to the page when the app opened the dialog', () => {
    const back: Mock<() => void> = vi.spyOn(history, 'back').mockReturnValue();

    openDialogUrl('game', 'tukoni');
    closeDialogUrl('game');

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('removes a dialog opened from a link without leaving the page', () => {
    const back: Mock<() => void> = vi.spyOn(history, 'back');

    history.replaceState(null, '', '/?game=tukoni');
    closeDialogUrl('game');

    expect(back).not.toHaveBeenCalled();
    expect(currentUrl()).toBe('/');
  });

  it('ignores a dialog that is no longer in the URL', () => {
    closeDialogUrl('auth');

    expect(listener).not.toHaveBeenCalled();
  });
});
