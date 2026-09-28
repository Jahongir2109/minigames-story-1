import type {
  Game,
  GameCategory,
  GameComment,
  GameDetails,
  LeaderboardEntry,
} from '@/shared/types/game';

import { getJson, type RequestOptions } from './client';

export type SortValue = 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
export type CommentsSort = 'newest' | 'oldest';

export interface ApiResponse<T, M = undefined> {
  data: T;
  meta: M;
}

export interface GamesQuery {
  category?: string;
  sort?: SortValue;
  page?: number;
  limit?: number;
}

export interface GamesMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface CommentsMeta {
  totalComments: number;
  returnedCount: number;
}

type Signal = Pick<RequestOptions, 'signal'>;

export async function fetchCategories(options: Signal = {}): Promise<GameCategory[]> {
  const response: ApiResponse<GameCategory[]> = await getJson('/categories', options);

  return response.data;
}

export async function fetchGames(
  query: GamesQuery,
  options: Signal = {},
): Promise<ApiResponse<Game[], GamesMeta>> {
  return getJson('/games', { ...options, query: { ...query } });
}

/**
 * Featured games of the Home slider (the API ignores the other list parameters).
 */
export async function fetchFeaturedGames(options: Signal = {}): Promise<Game[]> {
  const response: ApiResponse<Game[], GamesMeta> = await getJson('/games', {
    ...options,
    query: { featured: true },
  });

  return response.data;
}

export async function fetchGameDetails(slug: string, options: Signal = {}): Promise<GameDetails> {
  const response: ApiResponse<GameDetails> = await getJson(
    `/games/${encodeURIComponent(slug)}`,
    options,
  );

  return response.data;
}

export async function fetchGameComments(
  slug: string,
  query: { limit: number; sort?: CommentsSort },
  options: Signal = {},
): Promise<ApiResponse<GameComment[], CommentsMeta>> {
  return getJson(`/games/${encodeURIComponent(slug)}/comments`, {
    ...options,
    query: { ...query },
  });
}

export async function fetchLeaderboard(options: Signal = {}): Promise<LeaderboardEntry[]> {
  const response: ApiResponse<LeaderboardEntry[]> = await getJson('/leaderboard', options);

  return response.data;
}
