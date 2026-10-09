import { ApiError, getErrorMessage } from '@/api/client';
import { postComment } from '@/api/games';
import sendIcon from '@/assets/icons/send.svg?raw';
import userIcon from '@/assets/icons/user.svg?raw';
import { getCommentAuthorName, getProfileName } from '@/auth/profile';
import type { AppSession } from '@/auth/session';
import type { RequireSession } from '@/auth/session-guard';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { setButtonPending } from '@/components/ui/spinner/spinner';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

const INPUT_ID: string = 'game-comment-input';

export const COMMENT_MAX_LENGTH: number = 500;
export const COMMENT_GUEST_PLACEHOLDER: string = 'Log in to write a comment';
export const COMMENT_PLACEHOLDER: string = 'Write a comment…';
export const COMMENT_GUEST_WARNING: string = 'Log in to write comments.';
export const COMMENT_EMPTY_MESSAGE: string = 'Write something before sending the comment.';
export const COMMENT_TOO_LONG_MESSAGE: string = `A comment can be up to ${String(COMMENT_MAX_LENGTH)} characters long.`;
export const COMMENT_POSTED_MESSAGE: string = 'Your comment is posted.';
export const COMMENT_UNKNOWN_MESSAGE: string =
  'We could not confirm whether your comment was posted. Check the comments before sending it again.';

export interface CommentFormOptions {
  slug: string;
  /**
   * The signed-in user; a guest gets a locked form.
   */
  user: AppSession | undefined;
  requireSession: RequireSession;
  /**
   * Called after the server created the comment (to load the latest comments).
   */
  onPosted: () => void;
}

/**
 * Why a trimmed comment text cannot be sent, or `undefined` when it is valid (1–500 characters).
 */
export function validateCommentText(text: string): string | undefined {
  if (text === '') {
    return COMMENT_EMPTY_MESSAGE;
  }

  return text.length > COMMENT_MAX_LENGTH ? COMMENT_TOO_LONG_MESSAGE : undefined;
}

/**
 * The avatar letter of the comment form: the uppercase first character of the user name.
 */
export function getCommentFormInitial(user: AppSession): string {
  return getProfileName(user).charAt(0).toLocaleUpperCase();
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

function createAvatar(user: AppSession | undefined): HTMLSpanElement {
  return createElement('span', {
    className: 'game-comments__avatar game-comments__avatar--primary',
    attributes: { 'aria-hidden': 'true' },
    children: [
      user === undefined
        ? createIcon(userIcon, 'game-comments__avatar-icon')
        : getCommentFormInitial(user),
    ],
  });
}

function getFailureMessage(error: unknown): string {
  return error instanceof ApiError && error.isOutcomeUnknown
    ? COMMENT_UNKNOWN_MESSAGE
    : `Your comment was not posted. ${getErrorMessage(error)}`;
}

/**
 * The comment form of Game Details: only signed-in users can write. Enter (without Shift) or the
 * Send button posts the trimmed text; the form is locked while the request runs and keeps the text
 * when it fails, without sending it again by itself.
 */
export function createCommentForm(options: CommentFormOptions): HTMLFormElement {
  const isGuest: boolean = options.user === undefined;
  const textarea: HTMLTextAreaElement = createElement('textarea', {
    className: 'game-comments__input',
    attributes: {
      id: INPUT_ID,
      name: 'comment',
      rows: '1',
      maxlength: String(COMMENT_MAX_LENGTH),
      placeholder: isGuest ? COMMENT_GUEST_PLACEHOLDER : COMMENT_PLACEHOLDER,
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
      createAvatar(options.user),
      createElement('label', {
        className: 'visually-hidden',
        text: 'Write a comment',
        attributes: { for: INPUT_ID },
      }),
      textarea,
      sendButton,
    ],
  });
  let isPending: boolean = false;

  const updateSendButton = (): void => {
    sendButton.disabled =
      isGuest || isPending || validateCommentText(textarea.value.trim()) !== undefined;
  };

  const setPending = (isActive: boolean): void => {
    isPending = isActive;
    textarea.disabled = isGuest || isActive;
    form.setAttribute('aria-busy', String(isActive));
    setButtonPending(sendButton, isActive);
    updateSendButton();
  };

  const send = async (session: AppSession, text: string): Promise<void> => {
    setPending(true);

    try {
      await postComment(options.slug, {
        userEmail: session.email,
        authorName: getCommentAuthorName(session),
        text,
      });
      textarea.value = '';
      showSnackbar({ message: COMMENT_POSTED_MESSAGE, variant: 'success' });
      options.onPosted();
    } catch (error: unknown) {
      showSnackbar({ message: getFailureMessage(error), variant: 'error' });
    } finally {
      setPending(false);
      autoGrow(textarea);
    }
  };

  textarea.addEventListener('input', (): void => {
    autoGrow(textarea);
    updateSendButton();
  });

  // Enter sends the comment, Shift + Enter starts a new line.
  textarea.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    form.requestSubmit();
  });

  form.addEventListener('submit', (event: SubmitEvent): void => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const text: string = textarea.value.trim();
    const error: string | undefined = validateCommentText(text);

    if (error !== undefined) {
      showSnackbar({ message: error, variant: 'error' });
      return;
    }

    const session: AppSession | undefined = options.requireSession(COMMENT_GUEST_WARNING);

    if (session !== undefined) {
      void send(session, text);
    }
  });

  setPending(false);

  return form;
}
