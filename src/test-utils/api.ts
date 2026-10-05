import { type Mock, vi } from 'vitest';

import { API_BASE_URL } from '@/api/client';
import type { GameComment, GameDetails } from '@/shared/types/game';

export interface ApiRequest {
  method: string;
  /**
   * The path after the API base URL, e.g. `/games/tukoni/comments`.
   */
  path: string;
  query: Record<string, string>;
  body: unknown;
}

export type ApiHandler = (request: ApiRequest) => Response | Promise<Response>;

export interface ApiStub {
  fetch: Mock<(input: URL, init?: RequestInit) => Promise<Response>>;
  /**
   * Every request sent so far.
   */
  requests: () => ApiRequest[];
}

export function json(body: unknown, status: number = 200): Response {
  return Response.json(body, { status });
}

/**
 * Replaces `fetch` with a fake MiniGames API; the handler answers every request.
 */
export function stubApi(handler: ApiHandler): ApiStub {
  const sent: ApiRequest[] = [];
  const fetchMock: Mock<(input: URL, init?: RequestInit) => Promise<Response>> = vi.fn(
    async (input: URL, init?: RequestInit): Promise<Response> => {
      const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
      const request: ApiRequest = {
        method: init?.method ?? 'GET',
        path: `${input.origin}${input.pathname}`.replace(API_BASE_URL, ''),
        query: Object.fromEntries(input.searchParams),
        body,
      };

      sent.push(request);

      return handler(request);
    },
  );

  vi.stubGlobal('fetch', fetchMock);

  return { fetch: fetchMock, requests: (): ApiRequest[] => [...sent] };
}

export const GAME: GameDetails = {
  slug: 'tukoni-forest-keepers',
  name: 'Tukoni: Forest Keepers',
  heroImage: '/hero.png',
  rating: 4.8,
  likesCount: 120,
  isLikedByCurrentUser: false,
  fullDescription: 'Help the little Tukoni prepare for winter.',
  specs: { genre: 'Puzzle', players: '1', duration: '30 min', price: 'Free' },
  topRecords: [],
};

export function createComment(overrides: Partial<GameComment> = {}): GameComment {
  return {
    commentId: 'c-1',
    authorName: 'ForestDweller',
    text: 'The hand-drawn art is magical.',
    likesCount: 12,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-30T07:00:00Z',
    ...overrides,
  };
}

export function commentsResponse(comments: GameComment[], totalComments: number): Response {
  return json({
    data: comments,
    meta: { totalComments, returnedCount: comments.length, sort: 'newest' },
  });
}
