import { type HttpRequest, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '@/core/api/games-api';
import type { Game, GameComment, GameDetails, LeaderboardEntry } from '@/core/api/models';

export const TEST_API: string = 'https://api.test';

/**
 * HttpClient answered by the test (HttpTestingController) instead of the real API.
 */
export function provideTestApi(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    { provide: API_BASE_URL, useValue: TEST_API },
  ];
}

/**
 * The pending request to `path` (after the API base URL), whatever its query.
 */
export function expectApi(path: string, method: string = 'GET'): TestRequest {
  return TestBed.inject(HttpTestingController).expectOne(
    (request: HttpRequest<unknown>) =>
      request.method === method && request.url === `${TEST_API}${path}`,
  );
}

export function createGame(overrides: Partial<Game> = {}): Game {
  return {
    slug: 'tukoni',
    name: 'Tukoni',
    category: 'puzzle',
    price: 'Free',
    shortDescription: 'Help the little Tukoni prepare for winter.',
    rating: 4.8,
    likesCount: 54_200,
    cardImage: '/tukoni.jpg',
    ...overrides,
  };
}

export function createPlayer(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    playerName: 'Alex_Pro99',
    gamesPlayed: 142,
    totalScore: 94_250,
    streakDays: 12,
    favoriteGameSlug: 'tukoni',
    favoriteGameName: 'Tukoni',
    ...overrides,
  };
}

export const GAME_DETAILS: GameDetails = {
  slug: 'tukoni',
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
