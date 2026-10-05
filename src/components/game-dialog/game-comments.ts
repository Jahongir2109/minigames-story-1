import './game-comments.scss';

import { getErrorMessage, isAbortError } from '@/api/client';
import { fetchGameComments } from '@/api/games';
import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import sendIcon from '@/assets/icons/send.svg?raw';
import type { AppSession } from '@/auth/session';
import { createEmptyState } from '@/components/ui/empty-state/empty-state';
import { createErrorBanner } from '@/components/ui/error-banner/error-banner';
import { createSkeleton, createSkeletonRegion } from '@/components/ui/skeleton/skeleton';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { GameComment } from '@/shared/types/game';
import { formatRelativeTime } from '@/shared/utils/format';

const TITLE_ID: string = 'game-comments-title';
const INPUT_ID: string = 'game-comment-input';
// The latest comments shown in the dialog.
const COMMENTS_LIMIT: number = 3;

// Avatar colors in the order of the mockup.
const AVATAR_COLORS: readonly string[] = [
  'avatar-random-3',
  'primary',
  'avatar-random-1',
  'avatar-random-2',
  'avatar-random-4',
  'avatar-random-5',
];

function createAvatar(name: string, color: string): HTMLSpanElement {
  return createElement('span', {
    className: `game-comments__avatar game-comments__avatar--${color}`,
    text: name.charAt(0).toUpperCase(),
    attributes: { 'aria-hidden': 'true' },
  });
}

// Read-only for guests: liking comments needs an account (Story 4).
function createLikeButton(comment: GameComment): HTMLButtonElement {
  const count: HTMLSpanElement = createElement('span', { text: String(comment.likesCount) });
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-comments__like',
    attributes: {
      type: 'button',
      'aria-pressed': String(comment.isLikedByCurrentUser),
      'aria-label': `${String(comment.likesCount)} likes. Log in to like the comment by ${comment.authorName}`,
      title: 'Log in to like comments',
      disabled: '',
    },
    children: [createIcon(heartIcon, 'game-comments__like-icon'), count],
  });

  return button;
}

function createComment(comment: GameComment, index: number): HTMLLIElement {
  const color: string = AVATAR_COLORS[index % AVATAR_COLORS.length] ?? 'primary';
  const author: HTMLHeadingElement = createElement('h4', {
    className: 'game-comments__author',
    children: [createAvatar(comment.authorName, color), comment.authorName],
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
      createLikeButton(comment),
    ],
  });

  return createElement('li', { children: [article] });
}

/**
 * Grows the textarea with its content up to its CSS max-height (88px); only then the internal
 * scrollbar appears.
 */
function autoGrow(textarea: HTMLTextAreaElement): void {
  const borders: number = textarea.offsetHeight - textarea.clientHeight;
  const maxHeight: number = Number(getComputedStyle(textarea).maxHeight.replace('px', ''));

  textarea.style.height = 'auto';

  const contentHeight: number = textarea.scrollHeight + borders;

  textarea.style.height = `${String(contentHeight)}px`;
  textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
}

function createForm(): HTMLFormElement {
  const textarea: HTMLTextAreaElement = createElement('textarea', {
    className: 'game-comments__input',
    attributes: {
      id: INPUT_ID,
      name: 'comment',
      rows: '1',
      placeholder: 'Log in to write a comment',
      disabled: '',
    },
  });
  const sendButton: HTMLButtonElement = createElement('button', {
    className: 'game-comments__send',
    attributes: { type: 'submit', 'aria-label': 'Send comment' },
    children: [createIcon(sendIcon, 'game-comments__send-icon')],
  });
  const form: HTMLFormElement = createElement('form', {
    className: 'game-comments__form',
    children: [
      createAvatar('User', 'primary'),
      createElement('label', {
        className: 'visually-hidden',
        text: 'Write a comment',
        attributes: { for: INPUT_ID },
      }),
      textarea,
      sendButton,
    ],
  });

  sendButton.disabled = true;

  textarea.addEventListener('input', (): void => {
    autoGrow(textarea);
    sendButton.disabled = textarea.value.trim() === '';
  });

  // Sending comments needs an account (Story 4).
  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
  });

  return form;
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
 * the API, with the like state of the signed-in user. signal cancels the requests when the dialog
 * closes.
 */
export function createGameComments(
  slug: string,
  signal: AbortSignal,
  user?: AppSession,
): HTMLElement {
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-comments__title',
    text: 'Comments',
    attributes: { id: TITLE_ID },
  });
  const content: HTMLElement = createElement('div', { className: 'game-comments__content' });

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
          children: response.data.map((comment: GameComment, index: number): HTMLLIElement =>
            createComment(comment, index),
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
    children: [title, createForm(), content],
  });
}
