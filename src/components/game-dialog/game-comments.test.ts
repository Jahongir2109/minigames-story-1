import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppSession } from '@/auth/session';
import {
  type ApiRequest,
  type ApiStub,
  commentsResponse,
  createComment,
  json,
  stubApi,
} from '@/test-utils/api';

import { createGameComments } from './game-comments';

const SESSION: AppSession = { displayName: 'Alex', email: 'alex@rs.school', authenticatedAt: 1 };
const SLUG: string = 'tukoni-forest-keepers';

function mount(user?: AppSession): HTMLElement {
  const section: HTMLElement = createGameComments({
    slug: SLUG,
    signal: new AbortController().signal,
    user,
    requireSession: (): AppSession | undefined => user,
  });

  document.body.append(section);

  return section;
}

function heading(section: HTMLElement): string {
  return section.querySelector('.game-comments__title')?.textContent ?? '';
}

function commentsRequests(api: ApiStub): ApiRequest[] {
  return api.requests().filter((request: ApiRequest): boolean => request.method === 'GET');
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createGameComments', () => {
  it('shows the latest comments as text with the total count', async () => {
    const api: ApiStub = stubApi((): Response =>
      commentsResponse(
        [
          createComment({ text: '<img src=x onerror=alert(1)>' }),
          createComment({ commentId: 'c-2' }),
        ],
        7,
      ),
    );
    const section: HTMLElement = mount();

    expect(section.querySelector('[aria-busy="true"]')).not.toBeNull();
    await vi.waitFor(() => {
      expect(heading(section)).toBe('Comments (7)');
    });

    expect(section.querySelectorAll('.game-comments__card')).toHaveLength(2);
    expect(section.querySelector('.game-comments__text')?.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
    expect(section.querySelector('.game-comments__text')?.querySelector('img')).toBeNull();
    expect(commentsRequests(api)[0]?.query).toEqual({ limit: '3', sort: 'newest' });
  });

  it('asks for the like state of the signed-in user', async () => {
    const api: ApiStub = stubApi((): Response => commentsResponse([], 0));

    mount(SESSION);

    await vi.waitFor(() => {
      expect(commentsRequests(api)).toHaveLength(1);
    });
    expect(commentsRequests(api)[0]?.query).toEqual({
      limit: '3',
      sort: 'newest',
      userEmail: SESSION.email,
    });
  });

  it('shows an empty state without comments', async () => {
    stubApi((): Response => commentsResponse([], 0));
    const section: HTMLElement = mount();

    await vi.waitFor(() => {
      expect(section.textContent).toContain('No comments yet');
    });
    expect(heading(section)).toBe('Comments (0)');
  });

  it('shows an error banner that loads the comments again', async () => {
    let isFailing: boolean = true;
    const api: ApiStub = stubApi((): Response =>
      isFailing ? json({ error: 'Server error' }, 500) : commentsResponse([createComment()], 1),
    );
    const section: HTMLElement = mount();

    await vi.waitFor(() => {
      expect(section.textContent).toContain('Comments could not be loaded');
    });

    isFailing = false;
    section.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();

    await vi.waitFor(() => {
      expect(heading(section)).toBe('Comments (1)');
    });
    expect(commentsRequests(api)).toHaveLength(2);
  });

  it('reloads the three latest comments and the count after posting', async () => {
    let total: number = 1;
    const api: ApiStub = stubApi((request: ApiRequest): Response => {
      if (request.method === 'POST') {
        total += 1;

        return json({ data: createComment({ commentId: 'new', text: 'Mine' }) }, 201);
      }

      return commentsResponse([createComment()], total);
    });
    const section: HTMLElement = mount(SESSION);

    await vi.waitFor(() => {
      expect(heading(section)).toBe('Comments (1)');
    });

    const textarea: HTMLTextAreaElement | null = section.querySelector('textarea');

    if (textarea === null) {
      throw new Error('No comment input');
    }

    textarea.value = 'Mine';
    textarea.dispatchEvent(new Event('input'));
    section.querySelector<HTMLButtonElement>('.game-comments__send')?.click();

    await vi.waitFor(() => {
      expect(heading(section)).toBe('Comments (2)');
    });
    expect(commentsRequests(api)[1]?.query).toEqual({
      limit: '3',
      sort: 'newest',
      userEmail: SESSION.email,
    });
    expect(textarea.value).toBe('');
  });
});
