import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AppSession } from '@/auth/session';
import { type ApiRequest, type ApiStub, json, stubApi } from '@/test-utils/api';

import {
  createFavoriteButton,
  FAVORITE_ADDED_MESSAGE,
  FAVORITE_GUEST_WARNING,
  FAVORITE_REMOVED_MESSAGE,
  FAVORITE_UNKNOWN_MESSAGE,
} from './favorite-button';

const SESSION: AppSession = { displayName: 'Alex', email: 'alex@rs.school', authenticatedAt: 1 };
const SLUG: string = 'tukoni-forest-keepers';

interface Setup {
  button: HTMLButtonElement;
  requireSession: Mock<(warning: string) => AppSession | undefined>;
  onLikesCount: Mock<(likesCount: number) => void>;
}

interface SetupOptions {
  /**
   * The session that the guard returns; `undefined` for a guest.
   */
  session?: AppSession | undefined;
  isFavorited?: boolean;
}

function setup(options: SetupOptions = {}): Setup {
  const session: AppSession | undefined = 'session' in options ? options.session : SESSION;
  const isFavorited: boolean = options.isFavorited ?? false;
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi.fn(
    (): AppSession | undefined => session,
  );
  const onLikesCount: Mock<(likesCount: number) => void> = vi.fn();
  const button: HTMLButtonElement = createFavoriteButton({
    slug: SLUG,
    isFavorited,
    requireSession,
    onLikesCount,
  });

  document.body.append(button);

  return { button, requireSession, onLikesCount };
}

function snackbarText(): string {
  return document.querySelector('.snackbar-region')?.textContent ?? '';
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createFavoriteButton', () => {
  it('starts from the state of the signed-in user', () => {
    const { button } = setup({ isFavorited: true });

    expect(button.ariaPressed).toBe('true');
    expect(button.ariaLabel).toBe('Remove from Favorites');
  });

  it('sends nothing for a guest and asks for authentication', () => {
    const api: ApiStub = stubApi((): Response => json({}));
    const { button, requireSession } = setup({ session: undefined });

    button.click();

    expect(requireSession).toHaveBeenCalledWith(FAVORITE_GUEST_WARNING);
    expect(api.requests()).toHaveLength(0);
    expect(button.ariaPressed).toBe('false');
  });

  it('adds the game from the server answer and locks the button meanwhile', async () => {
    const api: ApiStub = stubApi((): Response =>
      json({ data: { isFavorited: true, likesCount: 121 } }),
    );
    const { button, onLikesCount } = setup();

    button.click();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner')).not.toBeNull();

    // A second click while pending is not sent.
    button.click();

    await vi.waitFor(() => {
      expect(button.disabled).toBe(false);
    });

    expect(api.requests()).toEqual<ApiRequest[]>([
      {
        method: 'POST',
        path: `/games/${SLUG}/favorite`,
        query: {},
        body: { userEmail: SESSION.email },
      },
    ]);
    expect(button.ariaPressed).toBe('true');
    expect(button.querySelector('.spinner')).toBeNull();
    expect(onLikesCount).toHaveBeenCalledWith(121);
    expect(snackbarText()).toContain(FAVORITE_ADDED_MESSAGE);
  });

  it('follows the server even when it disagrees with the button', async () => {
    stubApi((): Response => json({ data: { isFavorited: false, likesCount: 119 } }));
    const { button } = setup();

    button.click();

    await vi.waitFor(() => {
      expect(snackbarText()).toContain(FAVORITE_REMOVED_MESSAGE);
    });
    expect(button.ariaPressed).toBe('false');
  });

  it('keeps the state and unlocks after a refused request', async () => {
    stubApi((): Response => json({ error: 'Game not found' }, 404));
    const { button, onLikesCount } = setup();

    button.click();

    await vi.waitFor(() => {
      expect(button.disabled).toBe(false);
    });
    expect(button.ariaPressed).toBe('false');
    expect(onLikesCount).not.toHaveBeenCalled();
    expect(snackbarText()).toContain('Favorites were not updated. Game not found');
  });

  it('says the result is unknown after a lost connection and does not retry', async () => {
    const api: ApiStub = stubApi((): Promise<Response> => Promise.reject(new TypeError('offline')));
    const { button } = setup();

    button.click();

    await vi.waitFor(() => {
      expect(snackbarText()).toContain(FAVORITE_UNKNOWN_MESSAGE);
    });
    expect(api.requests()).toHaveLength(1);
    expect(button.ariaPressed).toBe('false');
  });
});
