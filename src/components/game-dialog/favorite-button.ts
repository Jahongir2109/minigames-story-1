import { ApiError, getErrorMessage } from '@/api/client';
import { type FavoriteState, toggleFavorite } from '@/api/games';
import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import type { AppSession } from '@/auth/session';
import type { RequireSession } from '@/auth/session-guard';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { setButtonPending } from '@/components/ui/spinner/spinner';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

const ADD_LABEL: string = 'Add to Favorites';
const REMOVE_LABEL: string = 'Remove from Favorites';

export const FAVORITE_GUEST_WARNING: string = 'Log in to add games to your favorites.';
export const FAVORITE_ADDED_MESSAGE: string = 'The game is in your favorites now.';
export const FAVORITE_REMOVED_MESSAGE: string = 'The game is no longer in your favorites.';
export const FAVORITE_UNKNOWN_MESSAGE: string =
  'We could not confirm whether your favorites changed. Reopen the game to see the current state.';

export interface FavoriteButtonOptions {
  slug: string;
  /**
   * The state of the signed-in user from the game details (`isLikedByCurrentUser`).
   */
  isFavorited: boolean;
  requireSession: RequireSession;
  /**
   * Receives the like count that the server returned with the new state.
   */
  onLikesCount: (likesCount: number) => void;
}

function getFailureMessage(error: unknown): string {
  return error instanceof ApiError && error.isOutcomeUnknown
    ? FAVORITE_UNKNOWN_MESSAGE
    : `Favorites were not updated. ${getErrorMessage(error)}`;
}

/**
 * Add to / Remove from Favorites. Only signed-in users can use it (a guest gets Auth); the state
 * changes only from the server answer, and the button stays locked while the request runs, so a
 * toggle is never sent twice or repeated automatically.
 */
export function createFavoriteButton(options: FavoriteButtonOptions): HTMLButtonElement {
  // Icon-only on mobile, so the button keeps its accessible name in `aria-label`.
  const label: HTMLSpanElement = createElement('span', {
    className: 'game-info__favorite-label',
    attributes: { 'aria-hidden': 'true' },
  });
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-info__favorite',
    attributes: { type: 'button' },
    children: [createIcon(heartIcon, 'game-info__favorite-icon'), label],
  });

  const render = (isFavorited: boolean): void => {
    const text: string = isFavorited ? REMOVE_LABEL : ADD_LABEL;

    button.ariaPressed = String(isFavorited);
    button.ariaLabel = text;
    label.textContent = text;
  };

  const toggle = async (session: AppSession): Promise<void> => {
    setButtonPending(button, true);

    try {
      const state: FavoriteState = await toggleFavorite(options.slug, session.email);

      render(state.isFavorited);
      options.onLikesCount(state.likesCount);
      showSnackbar({
        message: state.isFavorited ? FAVORITE_ADDED_MESSAGE : FAVORITE_REMOVED_MESSAGE,
        variant: 'success',
      });
    } catch (error: unknown) {
      showSnackbar({ message: getFailureMessage(error), variant: 'error' });
    } finally {
      setButtonPending(button, false);
    }
  };

  button.addEventListener('click', (): void => {
    const session: AppSession | undefined = options.requireSession(FAVORITE_GUEST_WARNING);

    if (session !== undefined) {
      void toggle(session);
    }
  });

  render(options.isFavorited);

  return button;
}
