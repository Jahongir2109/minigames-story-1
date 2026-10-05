import { ApiError, getErrorMessage } from '@/api/client';
import { type CommentLikeState, toggleCommentLike } from '@/api/games';
import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import type { AppSession } from '@/auth/session';
import type { RequireSession } from '@/auth/session-guard';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { setButtonPending } from '@/components/ui/spinner/spinner';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { GameComment } from '@/shared/types/game';

export const LIKE_GUEST_WARNING: string = 'Log in to like comments.';
export const LIKE_UNKNOWN_MESSAGE: string =
  'We could not confirm whether your like was saved. Reopen the game to see the current state.';

export interface CommentLikeButtonOptions {
  /**
   * The comment as loaded for the current user (`isLikedByCurrentUser`).
   */
  comment: GameComment;
  requireSession: RequireSession;
}

function getFailureMessage(error: unknown): string {
  return error instanceof ApiError && error.isOutcomeUnknown
    ? LIKE_UNKNOWN_MESSAGE
    : `The like was not saved. ${getErrorMessage(error)}`;
}

/**
 * Like / unlike a comment. Only signed-in users can use it (a guest gets Auth); the count and the
 * pressed state change only from the server answer, and the button stays locked while the request
 * runs, so a toggle is never sent twice or repeated automatically.
 */
export function createCommentLikeButton(options: CommentLikeButtonOptions): HTMLButtonElement {
  const { comment } = options;
  const count: HTMLSpanElement = createElement('span');
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-comments__like',
    attributes: { type: 'button' },
    children: [createIcon(heartIcon, 'game-comments__like-icon'), count],
  });

  const render = (state: CommentLikeState): void => {
    const likes: string = String(state.likesCount);

    count.textContent = likes;
    button.ariaPressed = String(state.isLikedByCurrentUser);
    button.ariaLabel = `${likes} likes. ${
      state.isLikedByCurrentUser ? 'Remove your like from' : 'Like'
    } the comment by ${comment.authorName}`;
  };

  const toggle = async (session: AppSession): Promise<void> => {
    setButtonPending(button, true);

    try {
      render(await toggleCommentLike(comment.commentId, session.email));
    } catch (error: unknown) {
      showSnackbar({ message: getFailureMessage(error), variant: 'error' });
    } finally {
      setButtonPending(button, false);
    }
  };

  button.addEventListener('click', (): void => {
    const session: AppSession | undefined = options.requireSession(LIKE_GUEST_WARNING);

    if (session !== undefined) {
      void toggle(session);
    }
  });

  render(comment);

  return button;
}
