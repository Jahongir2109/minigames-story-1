import { type HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable } from 'rxjs';

import { ApiError, getErrorKey, toApiError } from './api-error';
import { API_BASE_URL, GamesApi, MUTATION_TIMEOUT_MS } from './games-api';
import type { ApiResponse, Game, GamesMeta } from './models';

const BASE: string = 'https://api.test';

function setup(): { api: GamesApi; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });

  return { api: TestBed.inject(GamesApi), http: TestBed.inject(HttpTestingController) };
}

async function failure(source: Observable<unknown>): Promise<ApiError> {
  try {
    await firstValueFrom(source);
  } catch (error: unknown) {
    return error as ApiError;
  }

  throw new Error('The request did not fail.');
}

describe('GamesApi', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('sends the list query without the empty values', async () => {
    const { api, http } = setup();
    const response: Promise<ApiResponse<Game[], GamesMeta>> = firstValueFrom(
      api.games({ sort: 'name-asc', page: 2, limit: 6 }),
    );

    const request: ReturnType<HttpTestingController['expectOne']> = http.expectOne(
      (candidate: HttpRequest<unknown>) => candidate.url === `${BASE}/games`,
    );

    expect(request.request.params.toString()).toBe('sort=name-asc&page=2&limit=6');

    request.flush({ data: [], meta: { page: 2, limit: 6, totalItems: 0, totalPages: 0 } });

    await expect(response).resolves.toEqual({
      data: [],
      meta: { page: 2, limit: 6, totalItems: 0, totalPages: 0 },
    });
  });

  it('unwraps the data and encodes the slug of a game', async () => {
    const { api, http } = setup();
    const response: Promise<unknown> = firstValueFrom(api.gameDetails('a b', 'me@mail.com'));

    http
      .expectOne(`${BASE}/games/a%20b?userEmail=me@mail.com`)
      .flush({ data: { slug: 'a b' }, meta: {} });

    await expect(response).resolves.toEqual({ slug: 'a b' });
  });

  it('turns the API error body into an ApiError', async () => {
    const { api, http } = setup();
    const error: Promise<ApiError> = failure(api.games({ category: 'zzz' }));

    http
      .expectOne(() => true)
      .flush({ error: 'Invalid category parameter: zzz' }, { status: 400, statusText: 'Bad' });

    const result: ApiError = await error;

    expect(result).toBeInstanceOf(ApiError);
    expect(result.isBadRequest).toBe(true);
    expect(result.message).toBe('Invalid category parameter: zzz');
    expect(result.isOutcomeUnknown).toBe(false);
  });

  it('reports a lost connection as a network error with an unknown outcome', async () => {
    const { api, http } = setup();
    const error: Promise<ApiError> = failure(api.toggleFavorite('tukoni', 'me@mail.com'));

    http.expectOne(`${BASE}/games/tukoni/favorite`).error(new ProgressEvent('error'));

    const result: ApiError = await error;

    expect(result.kind).toBe('network');
    expect(result.isOutcomeUnknown).toBe(true);
    expect(getErrorKey(result)).toBe('errors.network');
  });

  it('gives up a mutation that runs too long', async () => {
    vi.useFakeTimers();

    const { api, http } = setup();
    const error: Promise<ApiError> = failure(
      api.postComment('tukoni', { userEmail: 'me@mail.com', authorName: 'Me', text: 'Hi' }),
    );
    const request: ReturnType<HttpTestingController['expectOne']> = http.expectOne(
      `${BASE}/games/tukoni/comments`,
    );

    expect(request.request.body).toEqual({
      userEmail: 'me@mail.com',
      authorName: 'Me',
      text: 'Hi',
    });

    vi.advanceTimersByTime(MUTATION_TIMEOUT_MS);

    const result: ApiError = await error;

    expect(result.kind).toBe('timeout');
    expect(result.isOutcomeUnknown).toBe(true);
    expect(request.cancelled).toBe(true);

    vi.useRealTimers();
  });
});

describe('getErrorKey', () => {
  it('explains every kind of failure in the language of the user', () => {
    expect(getErrorKey(new ApiError(0, '', 'timeout'))).toBe('errors.timeout');
    expect(getErrorKey(new ApiError(504, ''))).toBe('errors.timeout');
    expect(getErrorKey(new ApiError(404, ''))).toBe('errors.notFound');
    expect(getErrorKey(new ApiError(503, ''))).toBe('errors.server');
    expect(getErrorKey(new ApiError(422, ''))).toBe('errors.request');
    expect(getErrorKey(new Error('boom'))).toBe('errors.unexpected');
  });

  it('keeps an ApiError as it is', () => {
    const error: ApiError = new ApiError(404, 'Missing');

    expect(toApiError(error)).toBe(error);
  });
});
