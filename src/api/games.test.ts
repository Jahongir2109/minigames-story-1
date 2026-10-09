import { describe, expect, it, type Mock, vi } from 'vitest';

import { API_BASE_URL } from './client';
import {
  fetchCategories,
  fetchFeaturedGames,
  fetchGameComments,
  fetchGameDetails,
  fetchGames,
  fetchLeaderboard,
  postComment,
  toggleCommentLike,
  toggleFavorite,
} from './games';

type FetchMock = Mock<(input: URL, init?: RequestInit) => Promise<Response>>;

function stubFetch(body: unknown, status: number = 200): FetchMock {
  const fetchMock: FetchMock = vi.fn((): Promise<Response> =>
    Promise.resolve(Response.json(body, { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

// The requested path and query, e.g. `/games?page=2`.
function requestedPath(fetchMock: FetchMock): string {
  const input: URL | undefined = fetchMock.mock.calls[0]?.[0];

  if (input === undefined) {
    throw new Error('fetch was not called');
  }

  return input.href.replace(API_BASE_URL, '');
}

function requestedBody(fetchMock: FetchMock): unknown {
  const body: unknown = fetchMock.mock.calls[0]?.[1]?.body;

  return typeof body === 'string' ? JSON.parse(body) : undefined;
}

describe('read requests', () => {
  it('loads the categories', async () => {
    const fetchMock: FetchMock = stubFetch({ data: [{ slug: 'all' }] });

    await expect(fetchCategories()).resolves.toEqual([{ slug: 'all' }]);
    expect(requestedPath(fetchMock)).toBe('/categories');
  });

  it('sends the library filters to the API', async () => {
    const fetchMock: FetchMock = stubFetch({ data: [], meta: { page: 2 } });

    await fetchGames({ category: 'puzzle', sort: 'name-asc', page: 2, limit: 6 });

    expect(requestedPath(fetchMock)).toBe('/games?category=puzzle&sort=name-asc&page=2&limit=6');
  });

  it('loads the featured games', async () => {
    const fetchMock: FetchMock = stubFetch({ data: [{ slug: 'a' }], meta: {} });

    await expect(fetchFeaturedGames()).resolves.toEqual([{ slug: 'a' }]);
    expect(requestedPath(fetchMock)).toBe('/games?featured=true');
  });

  it('loads the leaderboard', async () => {
    const fetchMock: FetchMock = stubFetch({ data: [{ rank: 1 }] });

    await expect(fetchLeaderboard()).resolves.toEqual([{ rank: 1 }]);
    expect(requestedPath(fetchMock)).toBe('/leaderboard');
  });

  it('loads the game details for a guest without an email', async () => {
    const fetchMock: FetchMock = stubFetch({ data: { slug: 'a b' } });

    await expect(fetchGameDetails('a b')).resolves.toEqual({ slug: 'a b' });
    expect(requestedPath(fetchMock)).toBe('/games/a%20b');
  });

  it('personalizes the game details with the encoded email', async () => {
    const fetchMock: FetchMock = stubFetch({ data: {} });

    await fetchGameDetails('tukoni', { userEmail: 'student@rs.school' });

    expect(requestedPath(fetchMock)).toBe('/games/tukoni?userEmail=student%40rs.school');
  });

  it('loads the latest comments with the email of the user', async () => {
    const fetchMock: FetchMock = stubFetch({ data: [], meta: { totalComments: 0 } });

    await fetchGameComments('tukoni', { limit: 3, sort: 'newest', userEmail: 'a@b.co' });

    expect(requestedPath(fetchMock)).toBe(
      '/games/tukoni/comments?limit=3&sort=newest&userEmail=a%40b.co',
    );
  });
});

describe('mutations', () => {
  it('toggles a favorite with the user email', async () => {
    const fetchMock: FetchMock = stubFetch({ data: { isFavorited: true, likesCount: 7 } });

    await expect(toggleFavorite('tukoni', 'a@b.co')).resolves.toEqual({
      isFavorited: true,
      likesCount: 7,
    });
    expect(requestedPath(fetchMock)).toBe('/games/tukoni/favorite');
    expect(requestedBody(fetchMock)).toEqual({ userEmail: 'a@b.co' });
  });

  it('posts a comment', async () => {
    const comment: { commentId: string } = { commentId: 'c1' };
    const fetchMock: FetchMock = stubFetch({ data: comment }, 201);

    await expect(
      postComment('tukoni', { userEmail: 'a@b.co', authorName: 'Alex', text: 'Nice' }),
    ).resolves.toEqual(comment);
    expect(requestedPath(fetchMock)).toBe('/games/tukoni/comments');
    expect(requestedBody(fetchMock)).toEqual({
      userEmail: 'a@b.co',
      authorName: 'Alex',
      text: 'Nice',
    });
  });

  it('toggles a comment like', async () => {
    const fetchMock: FetchMock = stubFetch({
      data: { isLikedByCurrentUser: true, likesCount: 3 },
    });

    await expect(toggleCommentLike('c-1', 'a@b.co')).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 3,
    });
    expect(requestedPath(fetchMock)).toBe('/comments/c-1/like');
    expect(requestedBody(fetchMock)).toEqual({ userEmail: 'a@b.co' });
  });

  it('rejects when the server refuses the mutation', async () => {
    stubFetch({ error: 'Authentication required: userEmail is missing' }, 401);

    await expect(toggleFavorite('tukoni', '')).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required: userEmail is missing',
    });
  });
});
