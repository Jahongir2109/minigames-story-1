import './game-comments.scss';

import { getErrorMessage, isAbortError } from '@/api/client';
import { fetchGameComments } from '@/api/games';
import type { AppSession } from '@/auth/session';
import type { RequireSession } from '@/auth/session-guard';
import { createEmptyState } from '@/components/ui/empty-state/empty-state';
import { createErrorBanner } from '@/components/ui/error-banner/error-banner';
import { createSkeleton, createSkeletonRegion } from '@/components/ui/skeleton/skeleton';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { createElement } from '@/shared/dom/create-element';
import type { GameComment } from '@/shared/types/game';
import { formatRelativeTime } from '@/shared/utils/format';

import {
  type AvatarColorPicker,
  createAvatarColorPicker,
  createCommentAvatar,
} from './comment-avatar';
import { createCommentForm } from './comment-form';
import { createCommentLikeButton } from './comment-like-button';

const TITLE_ID: string = 'game-comments-title';
// The latest comments shown in the dialog.
const COMMENTS_LIMIT: number = 3;

function createComment(
  comment: GameComment,
  color: string,
  requireSession: RequireSession,
): HTMLLIElement {
  const author: HTMLHeadingElement = createElement('h4', {
    className: 'game-comments__author',
    children: [createCommentAvatar(comment.authorName, color), comment.authorName],
  });
  const date: HTMLTimeElement = createElement('time', {
    className: 'game-comments__date',
    text: formatRelativeTime(comment.createdAt),
    attributes: { datetime: comment.createdAt },
  });
  const article: HTMLElement = createElement('article', {
    className: 'game-comments__card',
    children: [
      createElement('header', {
        className: 'game-comments__card-header',
        children: [author, date],
      }),
      createElement('p', { className: 'game-comments__text', text: comment.text }),
      createCommentLikeButton({ comment, requireSession }),
    ],
  });

  return createElement('li', { children: [article] });
}

function createSkeletonList(): HTMLElement {
  return createSkeletonRegion(
    'Loading comments',
    Array.from({ length: COMMENTS_LIMIT }, (): HTMLElement =>
      createSkeleton('game-comments__skeleton'),
    ),
    'game-comments__list',
  );
}

/**
 * Comments section of the Game Details dialog: the latest comments and the total count come from
 * the API, with the like state of the signed-in user, who can also like and write comments.
 */
export interface GameCommentsOptions {
  slug: string;
  /**
   * Cancels the requests when the dialog closes.
   */
  signal: AbortSignal;
  user: AppSession | undefined;
  requireSession: RequireSession;
}

export function createGameComments(options: GameCommentsOptions): HTMLElement {
  const { slug, signal, user } = options;
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-comments__title',
    text: 'Comments',
    attributes: { id: TITLE_ID },
  });
  const content: HTMLElement = createElement('div', { className: 'game-comments__content' });
  // One color per commenter for as long as this section is mounted.
  const pickAvatarColor: AvatarColorPicker = createAvatarColorPicker();

  const load = async (): Promise<void> => {
    title.textContent = 'Comments';
    content.replaceChildren(createSkeletonList());

    try {
      const response: Awaited<ReturnType<typeof fetchGameComments>> = await fetchGameComments(
        slug,
        { limit: COMMENTS_LIMIT, sort: 'newest', userEmail: user?.email },
        { signal },
      );

      title.textContent = `Comments (${String(response.meta.totalComments)})`;

      if (response.data.length === 0) {
        content.replaceChildren(
          createEmptyState({
            title: 'No comments yet',
            message: 'Be the first to share what you think about this game.',
          }),
        );
        return;
      }

      content.replaceChildren(
        createElement('ul', {
          className: 'game-comments__list',
          children: response.data.map((comment: GameComment): HTMLLIElement =>
            createComment(comment, pickAvatarColor(comment.authorName), options.requireSession),
          ),
        }),
      );
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }

      content.replaceChildren(
        createErrorBanner({
          title: 'Comments could not be loaded',
          message: getErrorMessage(error),
          onRetry: (): void => {
            void load();
          },
        }),
      );
      showSnackbar({ message: 'Failed to load the comments.', variant: 'error' });
    }
  };

  void load();

  return createElement('section', {
    className: 'game-comments',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [
      title,
      createCommentForm({
        slug,
        user,
        requireSession: options.requireSession,
        onPosted: (): void => {
          void load();
        },
      }),
      content,
    ],
  });
}
