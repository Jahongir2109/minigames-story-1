import './game-comments.scss';

import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import sendIcon from '@/assets/icons/send.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { GameComment } from '@/shared/types/game';
import { formatRelativeTime } from '@/shared/utils/format';

const TITLE_ID: string = 'game-comments-title';
const INPUT_ID: string = 'game-comment-input';

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

// Each like button toggles on its own and never touches the others.
function createLikeButton(comment: GameComment): HTMLButtonElement {
  const count: HTMLSpanElement = createElement('span', { text: String(comment.likesCount) });
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-comments__like',
    attributes: {
      type: 'button',
      'aria-pressed': String(comment.isLikedByCurrentUser),
      'aria-label': `Like the comment by ${comment.authorName}`,
    },
    children: [createIcon(heartIcon, 'game-comments__like-icon'), count],
  });

  button.addEventListener('click', (): void => {
    const isLiked: boolean = button.ariaPressed !== 'true';

    button.ariaPressed = String(isLiked);
    count.textContent = String(comment.likesCount + (isLiked ? 1 : 0));
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
    attributes: { id: INPUT_ID, name: 'comment', rows: '1', placeholder: 'Write a comment...' },
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

  // Sending comments comes with the API.
  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();
  });

  return form;
}

export function createGameComments(comments: readonly GameComment[]): HTMLElement {
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-comments__title',
    text: `Comments (${String(comments.length)})`,
    attributes: { id: TITLE_ID },
  });
  const list: HTMLUListElement = createElement('ul', {
    className: 'game-comments__list',
    children: comments.map((comment: GameComment, index: number): HTMLLIElement =>
      createComment(comment, index),
    ),
  });

  return createElement('section', {
    className: 'game-comments',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [title, createForm(), list],
  });
}
