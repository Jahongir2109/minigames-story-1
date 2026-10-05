import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import {
  API_BASE_URL,
  ApiError,
  createLatestRequest,
  getErrorMessage,
  getJson,
  isAbortError,
  type LatestRequest,
  MUTATION_TIMEOUT_MS,
  postJson,
} from './client';

type FetchMock = Mock<(input: URL, init?: RequestInit) => Promise<Response>>;

function jsonResponse(body: unknown, status: number = 200): Response {
  return Response.json(body, { status });
}

function stubFetch(
  implementation: (input: URL, init?: RequestInit) => Promise<Response>,
): FetchMock {
  const fetchMock: FetchMock = vi.fn(implementation);

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function abortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}

// Resolves to the error a promise rejects with.
async function catchError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error: unknown) {
    return error;
  }

  throw new Error('The promise did not reject');
}

function requestedUrl(fetchMock: FetchMock): URL {
  const input: URL | undefined = fetchMock.mock.calls[0]?.[0];

  if (input === undefined) {
    throw new Error('fetch was not called');
  }

  return input;
}

describe('ApiError', () => {
  it.each([
    [0, true],
    [504, true],
    [400, false],
    [500, false],
  ])('status %i has an unknown outcome: %s', (status: number, isUnknown: boolean) => {
    expect(new ApiError(status, 'x').isOutcomeUnknown).toBe(isUnknown);
  });

  it('recognizes "not found"', () => {
    expect(new ApiError(404, 'x').isNotFound).toBe(true);
    expect(new ApiError(400, 'x').isNotFound).toBe(false);
  });
});

describe('getJson', () => {
  it('builds the URL with the defined query parameters only', async () => {
    const fetchMock: FetchMock = stubFetch(() => Promise.resolve(jsonResponse({ data: [] })));

    await expect(
      getJson('/games', {
        query: { category: 'puzzle', page: 2, featured: true, sort: undefined },
      }),
    ).resolves.toEqual({ data: [] });

    const url: URL = requestedUrl(fetchMock);

    expect(`${url.origin}${url.pathname}`).toBe(`${API_BASE_URL}/games`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      category: 'puzzle',
      page: '2',
      featured: 'true',
    });
  });

  it('encodes an email in the query', async () => {
    const fetchMock: FetchMock = stubFetch(() => Promise.resolve(jsonResponse({})));

    await getJson('/games/x', { query: { userEmail: 'a+b@rs.school' } });

    expect(requestedUrl(fetchMock).search).toBe('?userEmail=a%2Bb%40rs.school');
  });

  it('rejects with the API error message', async () => {
    stubFetch(() => Promise.resolve(jsonResponse({ error: 'Invalid sort value' }, 400)));

    const error: unknown = await catchError(getJson('/games'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'Invalid sort value' });
  });

  it('falls back to the status text for a body without JSON', async () => {
    stubFetch(() =>
      Promise.resolve(new Response('<html>', { status: 502, statusText: 'Bad Gateway' })),
    );

    await expect(getJson('/games')).rejects.toMatchObject({
      status: 502,
      message: 'Bad Gateway',
    });
  });

  it('describes a failed status without status text', async () => {
    stubFetch(() => Promise.resolve(jsonResponse({ unexpected: true }, 500)));

    await expect(getJson('/games')).rejects.toMatchObject({
      message: 'Request failed with status 500',
    });
  });

  it('reports an unreachable server as status 0', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    await expect(getJson('/games')).rejects.toMatchObject({ status: 0, isOutcomeUnknown: true });
  });

  it('passes an abort through unchanged', async () => {
    stubFetch(() => Promise.reject(abortError()));

    const error: unknown = await catchError(getJson('/games', { signal: AbortSignal.abort() }));

    expect(isAbortError(error)).toBe(true);
  });
});

describe('postJson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends the body as JSON', async () => {
    const fetchMock: FetchMock = stubFetch(() =>
      Promise.resolve(jsonResponse({ data: { ok: true } }, 201)),
    );

    await expect(postJson('/games/x/favorite', { userEmail: 'a@b.co' })).resolves.toEqual({
      data: { ok: true },
    });

    const init: RequestInit | undefined = fetchMock.mock.calls[0]?.[1];

    expect(requestedUrl(fetchMock).href).toBe(`${API_BASE_URL}/games/x/favorite`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(init?.body).toBe('{"userEmail":"a@b.co"}');
  });

  it('rejects with a definite error when the server refuses', async () => {
    stubFetch(() => Promise.resolve(jsonResponse({ error: 'Invalid text' }, 400)));

    const error: unknown = await catchError(postJson('/games/x/comments', {}));

    expect(error).toMatchObject({ status: 400, message: 'Invalid text', isOutcomeUnknown: false });
  });

  it('reports a lost connection as an unknown outcome', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    await expect(postJson('/games/x/comments', {})).rejects.toMatchObject({
      status: 0,
      isOutcomeUnknown: true,
    });
  });

  it('gives up after the timeout with an unknown outcome', async () => {
    stubFetch(
      (_input: URL, init?: RequestInit): Promise<Response> =>
        new Promise<Response>((_resolve: unknown, reject: (reason: unknown) => void): void => {
          init?.signal?.addEventListener('abort', (): void => {
            reject(abortError());
          });
        }),
    );

    const result: Promise<unknown> = catchError(postJson('/games/x/comments', {}));

    await vi.advanceTimersByTimeAsync(MUTATION_TIMEOUT_MS);

    expect(await result).toMatchObject({
      status: 0,
      message: 'The server did not answer in time.',
      isOutcomeUnknown: true,
    });
  });
});

describe('createLatestRequest', () => {
  it('aborts the previous request when a new one starts', () => {
    const request: LatestRequest = createLatestRequest();
    const first: AbortSignal = request.next();
    const second: AbortSignal = request.next();

    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(false);

    request.abort();
    expect(second.aborted).toBe(true);
  });
});

describe('getErrorMessage', () => {
  it('uses the message of an API error and a generic one otherwise', () => {
    expect(getErrorMessage(new ApiError(400, 'Bad request'))).toBe('Bad request');
    expect(getErrorMessage(new Error('boom'))).toBe(
      'Something unexpected happened. Please try again.',
    );
  });
});
