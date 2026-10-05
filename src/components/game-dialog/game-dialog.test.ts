import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createSessionStore, type SessionStore } from '@/auth/session';
import {
  type ApiRequest,
  type ApiStub,
  commentsResponse,
  createComment,
  GAME,
  json,
  stubApi,
} from '@/test-utils/api';

import { createGameDialog, type GameDialog } from './game-dialog';

const PROFILE: { displayName: string; email: string } = {
  displayName: 'Alex',
  email: 'alex@minigames.com',
};

interface Setup {
  dialog: GameDialog;
  session: SessionStore;
  onClose: Mock<() => void>;
}

function setup(): Setup {
  const session: SessionStore = createSessionStore({
    storage: localStorage,
    signOut: (): Promise<void> => Promise.resolve(),
  });
  const onClose: Mock<() => void> = vi.fn();
  const dialog: GameDialog = createGameDialog({ session, onClose });

  document.body.append(dialog.element);

  return { dialog, session, onClose };
}

function stubGame(): ApiStub {
  return stubApi((request: ApiRequest): Response => {
    return request.path.endsWith('/comments')
      ? commentsResponse([createComment()], 1)
      : json({ data: GAME });
  });
}

function detailsRequests(api: ApiStub): ApiRequest[] {
  return api
    .requests()
    .filter((request: ApiRequest): boolean => request.path === `/games/${GAME.slug}`);
}

async function waitForTitle(dialog: GameDialog, title: string): Promise<void> {
  await vi.waitFor(() => {
    expect(dialog.element.querySelector('#game-dialog-title')?.textContent).toBe(title);
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('createGameDialog', () => {
  it('loads the game and its comments for a guest', async () => {
    const api: ApiStub = stubGame();
    const { dialog } = setup();

    dialog.open(GAME.slug);

    expect(dialog.element.open).toBe(true);
    expect(dialog.element.querySelector('[aria-busy="true"]')).not.toBeNull();
    await waitForTitle(dialog, GAME.name);
    await vi.waitFor(() => {
      expect(dialog.element.querySelector('.game-comments__title')?.textContent).toBe(
        'Comments (1)',
      );
    });

    expect(detailsRequests(api)[0]?.query).toEqual({});
    expect(api.requests()[1]?.query).toEqual({ limit: '3', sort: 'newest' });
  });

  it('personalizes the requests for a signed-in user', async () => {
    const api: ApiStub = stubGame();
    const { dialog, session } = setup();

    session.start(PROFILE);
    dialog.open(GAME.slug);
    await waitForTitle(dialog, GAME.name);

    expect(detailsRequests(api)[0]?.query).toEqual({ userEmail: PROFILE.email });
    expect(api.requests()[1]?.query).toMatchObject({ userEmail: PROFILE.email });
  });

  it('reloads the open game when the user signs in and logs out', async () => {
    const api: ApiStub = stubGame();
    const { dialog, session } = setup();

    dialog.open(GAME.slug);
    await waitForTitle(dialog, GAME.name);

    session.start(PROFILE);
    await vi.waitFor(() => {
      expect(detailsRequests(api)).toHaveLength(2);
    });
    expect(detailsRequests(api)[1]?.query).toEqual({ userEmail: PROFILE.email });

    await session.end();
    await vi.waitFor(() => {
      expect(detailsRequests(api)).toHaveLength(3);
    });
    expect(detailsRequests(api)[2]?.query).toEqual({});
  });

  it('does not reload a closed dialog when the session changes', () => {
    const api: ApiStub = stubGame();
    const { session } = setup();

    session.start(PROFILE);

    expect(api.requests()).toHaveLength(0);
  });

  it('keeps the game while hidden under Auth and shows it again', async () => {
    const api: ApiStub = stubGame();
    const { dialog, onClose } = setup();

    dialog.open(GAME.slug);
    await waitForTitle(dialog, GAME.name);

    dialog.hide(GAME.slug);
    expect(dialog.element.open).toBe(false);

    dialog.open(GAME.slug);
    expect(dialog.element.open).toBe(true);
    expect(dialog.element.querySelector('#game-dialog-title')?.textContent).toBe(GAME.name);
    expect(detailsRequests(api)).toHaveLength(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('loads a game that is hidden from the start (Auth over Game Details link)', async () => {
    const api: ApiStub = stubGame();
    const { dialog } = setup();

    dialog.hide(GAME.slug);

    expect(dialog.element.open).toBe(false);
    await vi.waitFor(() => {
      expect(detailsRequests(api)).toHaveLength(1);
    });

    dialog.open(GAME.slug);
    await waitForTitle(dialog, GAME.name);
    expect(detailsRequests(api)).toHaveLength(1);
  });

  it('reports a user close and forgets the game', async () => {
    const api: ApiStub = stubGame();
    const { dialog, onClose } = setup();

    dialog.open(GAME.slug);
    dialog.close();

    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    dialog.open(GAME.slug);
    expect(detailsRequests(api)).toHaveLength(2);
  });

  it('forgets a hidden game when it is closed', () => {
    const api: ApiStub = stubGame();
    const { dialog, onClose } = setup();

    dialog.hide(GAME.slug);
    dialog.close();
    dialog.open(GAME.slug);

    expect(detailsRequests(api)).toHaveLength(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes with the close button and the backdrop', async () => {
    stubGame();
    const { dialog, onClose } = setup();

    dialog.open(GAME.slug);
    dialog.element.querySelector<HTMLButtonElement>('.game-dialog__close')?.click();
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    dialog.open(GAME.slug);
    dialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  it('shows "not found" for an unknown game', async () => {
    stubApi((): Response => json({ error: 'Game not found' }, 404));
    const { dialog } = setup();

    dialog.open('missing');

    await waitForTitle(dialog, 'Game Not Found');
    expect(dialog.element.textContent).toContain('There is no game "missing"');
  });

  it('shows an error banner that retries the request', async () => {
    let isFailing: boolean = true;
    const api: ApiStub = stubApi((request: ApiRequest): Response => {
      if (request.path.endsWith('/comments')) {
        return commentsResponse([], 0);
      }

      return isFailing ? json({ error: 'Server error' }, 500) : json({ data: GAME });
    });
    const { dialog } = setup();

    dialog.open(GAME.slug);
    await waitForTitle(dialog, 'Game details could not be loaded');
    expect(dialog.element.textContent).toContain('Server error');

    isFailing = false;
    dialog.element.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();

    await waitForTitle(dialog, GAME.name);
    expect(detailsRequests(api)).toHaveLength(2);
  });
});
