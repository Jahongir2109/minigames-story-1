import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AppSession } from '@/auth/session';
import type { GameComment } from '@/shared/types/game';
import { type ApiStub, createComment, json, stubApi } from '@/test-utils/api';

import {
  createCommentLikeButton,
  LIKE_GUEST_WARNING,
  LIKE_UNKNOWN_MESSAGE,
} from './comment-like-button';

const SESSION: AppSession = { displayName: 'Alex', email: 'alex@rs.school', authenticatedAt: 1 };

interface Setup {
  button: HTMLButtonElement;
  requireSession: Mock<(warning: string) => AppSession | undefined>;
}

function setup(comment: GameComment, session?: AppSession): Setup {
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi.fn(
    (): AppSession | undefined => session,
  );
  const button: HTMLButtonElement = createCommentLikeButton({ comment, requireSession });

  document.body.append(button);

  return { button, requireSession };
}

function snackbarText(): string {
  return document.querySelector('.snackbar-region')?.textContent ?? '';
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createCommentLikeButton', () => {
  it('starts from the personalized state of the comment', () => {
    const { button } = setup(createComment({ likesCount: 5, isLikedByCurrentUser: true }));

    expect(button.textContent).toBe('5');
    expect(button.ariaPressed).toBe('true');
    expect(button.ariaLabel).toBe('5 likes. Remove your like from the comment by ForestDweller');
  });

  it('sends nothing for a guest and asks for authentication', () => {
    const api: ApiStub = stubApi((): Response => json({}));
    const { button, requireSession } = setup(createComment());

    button.click();

    expect(requireSession).toHaveBeenCalledWith(LIKE_GUEST_WARNING);
    expect(api.requests()).toHaveLength(0);
    expect(button.disabled).toBe(false);
  });

  it('likes the comment from the server answer and locks meanwhile', async () => {
    const api: ApiStub = stubApi((): Response =>
      json({ data: { isLikedByCurrentUser: true, likesCount: 13 } }),
    );
    const { button } = setup(createComment({ commentId: 'c-42', likesCount: 12 }), SESSION);

    button.click();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner')).not.toBeNull();

    // A second click while pending is not sent.
    button.click();

    await vi.waitFor(() => {
      expect(button.disabled).toBe(false);
    });

    expect(api.requests()).toEqual([
      {
        method: 'POST',
        path: '/comments/c-42/like',
        query: {},
        body: { userEmail: SESSION.email },
      },
    ]);
    expect(button.textContent).toBe('13');
    expect(button.ariaPressed).toBe('true');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('takes the like back when the server says so', async () => {
    stubApi((): Response => json({ data: { isLikedByCurrentUser: false, likesCount: 4 } }));
    const { button } = setup(createComment({ likesCount: 5, isLikedByCurrentUser: true }), SESSION);

    button.click();

    await vi.waitFor(() => {
      expect(button.textContent).toBe('4');
    });
    expect(button.ariaPressed).toBe('false');
  });

  it('keeps the state after a refused request', async () => {
    stubApi((): Response => json({ error: 'Comment not found' }, 404));
    const { button } = setup(createComment({ likesCount: 12 }), SESSION);

    button.click();

    await vi.waitFor(() => {
      expect(snackbarText()).toContain('The like was not saved. Comment not found');
    });
    expect(button.textContent).toBe('12');
    expect(button.ariaPressed).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('says the result is unknown after a lost connection and does not retry', async () => {
    const api: ApiStub = stubApi((): Promise<Response> => Promise.reject(new TypeError('offline')));
    const { button } = setup(createComment(), SESSION);

    button.click();

    await vi.waitFor(() => {
      expect(snackbarText()).toContain(LIKE_UNKNOWN_MESSAGE);
    });
    expect(api.requests()).toHaveLength(1);
  });
});
