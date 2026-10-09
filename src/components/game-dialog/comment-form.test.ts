import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { AppSession } from '@/auth/session';
import { type ApiStub, createComment, json, stubApi } from '@/test-utils/api';

import {
  COMMENT_EMPTY_MESSAGE,
  COMMENT_GUEST_PLACEHOLDER,
  COMMENT_GUEST_WARNING,
  COMMENT_MAX_LENGTH,
  COMMENT_POSTED_MESSAGE,
  COMMENT_TOO_LONG_MESSAGE,
  COMMENT_UNKNOWN_MESSAGE,
  createCommentForm,
  getCommentFormInitial,
  validateCommentText,
} from './comment-form';

const SESSION: AppSession = {
  displayName: 'forest Dweller',
  email: 'student@rs.school',
  authenticatedAt: 1,
};
const SLUG: string = 'tukoni-forest-keepers';

interface SetupOptions {
  /**
   * The signed-in user; `undefined` for a guest.
   */
  user?: AppSession | undefined;
  /**
   * What the session guard returns when the comment is sent.
   */
  guarded?: AppSession | undefined;
}

interface Setup {
  form: HTMLFormElement;
  textarea: HTMLTextAreaElement;
  send: HTMLButtonElement;
  requireSession: Mock<(warning: string) => AppSession | undefined>;
  onPosted: Mock<() => void>;
}

function setup(options: SetupOptions = {}): Setup {
  const user: AppSession | undefined = 'user' in options ? options.user : SESSION;
  const guarded: AppSession | undefined = 'guarded' in options ? options.guarded : user;
  const requireSession: Mock<(warning: string) => AppSession | undefined> = vi.fn(
    (): AppSession | undefined => guarded,
  );
  const onPosted: Mock<() => void> = vi.fn();
  const form: HTMLFormElement = createCommentForm({ slug: SLUG, user, requireSession, onPosted });

  document.body.append(form);

  const textarea: HTMLTextAreaElement | null = form.querySelector('textarea');
  const send: HTMLButtonElement | null = form.querySelector('.game-comments__send');

  if (textarea === null || send === null) {
    throw new Error('The comment form is incomplete');
  }

  return { form, textarea, send, requireSession, onPosted };
}

function type(textarea: HTMLTextAreaElement, value: string): void {
  textarea.value = value;
  textarea.dispatchEvent(new Event('input'));
}

function pressEnter(textarea: HTMLTextAreaElement, isShiftPressed: boolean = false): KeyboardEvent {
  const event: KeyboardEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    shiftKey: isShiftPressed,
    cancelable: true,
  });

  textarea.dispatchEvent(event);

  return event;
}

function snackbarText(): string {
  return document.querySelector('.snackbar-region')?.textContent ?? '';
}

function stubCreated(): ApiStub {
  return stubApi((): Response => json({ data: createComment() }, 201));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('validateCommentText', () => {
  it('accepts 1 to 500 characters', () => {
    expect(validateCommentText('a')).toBeUndefined();
    expect(validateCommentText('a'.repeat(COMMENT_MAX_LENGTH))).toBeUndefined();
  });

  it('rejects an empty or too long text', () => {
    expect(validateCommentText('')).toBe(COMMENT_EMPTY_MESSAGE);
    expect(validateCommentText('a'.repeat(COMMENT_MAX_LENGTH + 1))).toBe(COMMENT_TOO_LONG_MESSAGE);
  });
});

describe('getCommentFormInitial', () => {
  it('is the uppercase first letter of the user name', () => {
    expect(getCommentFormInitial(SESSION)).toBe('F');
    expect(getCommentFormInitial({ ...SESSION, displayName: '', email: 'zed@rs.school' })).toBe(
      'Z',
    );
  });
});

describe('createCommentForm', () => {
  it('is locked for a guest', () => {
    const { form, textarea, send } = setup({ user: undefined });

    expect(textarea.disabled).toBe(true);
    expect(textarea.placeholder).toBe(COMMENT_GUEST_PLACEHOLDER);
    expect(send.disabled).toBe(true);
    expect(form.querySelector('.game-comments__avatar')?.querySelector('svg')).not.toBeNull();
  });

  it('starts empty for a signed-in user with their initial', () => {
    const { form, textarea, send } = setup();

    expect(textarea.disabled).toBe(false);
    expect(textarea.value).toBe('');
    expect(textarea.maxLength).toBe(COMMENT_MAX_LENGTH);
    expect(send.disabled).toBe(true);
    expect(form.querySelector('.game-comments__avatar')?.textContent).toBe('F');
  });

  it('enables Send only for a text with content', () => {
    const { textarea, send } = setup();

    type(textarea, ' '.repeat(3));
    expect(send.disabled).toBe(true);

    type(textarea, 'Nice game');
    expect(send.disabled).toBe(false);
  });

  it('posts the trimmed text with the session identity on Enter', async () => {
    const api: ApiStub = stubCreated();
    const { textarea, onPosted } = setup();

    type(textarea, '  Such a calming little game!  ');
    const event: KeyboardEvent = pressEnter(textarea);

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.disabled).toBe(true);

    await vi.waitFor(() => {
      expect(onPosted).toHaveBeenCalledTimes(1);
    });

    expect(api.requests()[0]).toEqual({
      method: 'POST',
      path: `/games/${SLUG}/comments`,
      query: {},
      body: {
        userEmail: SESSION.email,
        authorName: 'forest Dweller',
        text: 'Such a calming little game!',
      },
    });
    expect(textarea.value).toBe('');
    expect(textarea.disabled).toBe(false);
    expect(snackbarText()).toContain(COMMENT_POSTED_MESSAGE);
  });

  it('keeps Shift + Enter for a new line', () => {
    const api: ApiStub = stubCreated();
    const { textarea } = setup();

    type(textarea, 'Line one');

    expect(pressEnter(textarea, true).defaultPrevented).toBe(false);
    expect(api.requests()).toHaveLength(0);
  });

  it('locks the textarea and Send while the request runs', async () => {
    const api: ApiStub = stubCreated();
    const { form, textarea, send } = setup();

    type(textarea, 'Hello');
    send.click();

    expect(textarea.disabled).toBe(true);
    expect(send.disabled).toBe(true);
    expect(send.getAttribute('aria-busy')).toBe('true');

    // Another submit while pending is ignored.
    form.requestSubmit();

    await vi.waitFor(() => {
      expect(textarea.disabled).toBe(false);
    });
    expect(api.requests()).toHaveLength(1);
  });

  it('does not send an empty text', () => {
    const api: ApiStub = stubCreated();
    const { form, textarea } = setup();

    type(textarea, '  ');
    form.requestSubmit();

    expect(api.requests()).toHaveLength(0);
    expect(snackbarText()).toContain(COMMENT_EMPTY_MESSAGE);
  });

  it('does not send a text over 500 characters', () => {
    const api: ApiStub = stubCreated();
    const { form, textarea } = setup();

    // A pasted text can be longer than maxlength; the submit handler checks it again.
    textarea.value = 'a'.repeat(COMMENT_MAX_LENGTH + 1);
    form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));

    expect(api.requests()).toHaveLength(0);
    expect(snackbarText()).toContain(COMMENT_TOO_LONG_MESSAGE);
  });

  it('sends nothing when the session has ended', () => {
    const api: ApiStub = stubCreated();
    const { textarea, send, requireSession } = setup({ guarded: undefined });

    type(textarea, 'Hello');
    send.click();

    expect(requireSession).toHaveBeenCalledWith(COMMENT_GUEST_WARNING);
    expect(api.requests()).toHaveLength(0);
    expect(textarea.value).toBe('Hello');
  });

  it('keeps the text for a retry when the server refuses it', async () => {
    stubApi((): Response => json({ error: 'Invalid text: must be 1-500 characters' }, 400));
    const { textarea, send, onPosted } = setup();

    type(textarea, 'Hello');
    send.click();

    await vi.waitFor(() => {
      expect(textarea.disabled).toBe(false);
    });
    expect(textarea.value).toBe('Hello');
    expect(send.disabled).toBe(false);
    expect(onPosted).not.toHaveBeenCalled();
    expect(snackbarText()).toContain(
      'Your comment was not posted. Invalid text: must be 1-500 characters',
    );
  });

  it('says the result is unknown after a lost connection and does not resend', async () => {
    const api: ApiStub = stubApi((): Promise<Response> => Promise.reject(new TypeError('offline')));
    const { textarea, onPosted } = setup();

    type(textarea, 'Hello');
    pressEnter(textarea);

    await vi.waitFor(() => {
      expect(snackbarText()).toContain(COMMENT_UNKNOWN_MESSAGE);
    });
    expect(textarea.value).toBe('Hello');
    expect(api.requests()).toHaveLength(1);
    expect(onPosted).not.toHaveBeenCalled();
  });
});
