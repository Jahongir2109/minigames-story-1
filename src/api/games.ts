import type {
  Game,
  GameCategory,
  GameComment,
  GameDetails,
  LeaderboardEntry,
} from '@/shared/types/game';

import { getJson, postJson, type RequestOptions } from './client';

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

export interface GameDetailsQuery {
  /**
   * The signed-in user: personalizes `isLikedByCurrentUser`. Guests omit it.
   */
  userEmail?: string;
}

export interface CommentsQuery {
  limit: number;
  sort?: CommentsSort;
  /**
   * The signed-in user: personalizes `isLikedByCurrentUser` of every comment. Guests omit it.
   */
  userEmail?: string;
}

export interface FavoriteState {
  isFavorited: boolean;
  likesCount: number;
}

export interface CommentLikeState {
  isLikedByCurrentUser: boolean;
  likesCount: number;
}

export interface NewComment {
  userEmail: string;
  /**
   * 2–30 characters.
   */
  authorName: string;
  /**
   * 1–500 characters after trimming.
   */
  text: string;
}

function getGamePath(slug: string): string {
  return `/games/${encodeURIComponent(slug)}`;
}

export async function fetchGameDetails(
  slug: string,
  query: GameDetailsQuery = {},
  options: Signal = {},
): Promise<GameDetails> {
  const response: ApiResponse<GameDetails> = await getJson(getGamePath(slug), {
    ...options,
    query: { ...query },
  });

  return response.data;
}

export async function fetchGameComments(
  slug: string,
  query: CommentsQuery,
  options: Signal = {},
): Promise<ApiResponse<GameComment[], CommentsMeta>> {
  return getJson(`${getGamePath(slug)}/comments`, { ...options, query: { ...query } });
}

/**
 * Adds the game to the user's favorites or removes it: every successful call flips the state.
 */
export async function toggleFavorite(slug: string, userEmail: string): Promise<FavoriteState> {
  const response: ApiResponse<FavoriteState> = await postJson(`${getGamePath(slug)}/favorite`, {
    userEmail,
  });

  return response.data;
}

export async function postComment(slug: string, comment: NewComment): Promise<GameComment> {
  const response: ApiResponse<GameComment> = await postJson(
    `${getGamePath(slug)}/comments`,
    comment,
  );

  return response.data;
}

/**
 * Likes the comment or takes the like back: every successful call flips the state.
 */
export async function toggleCommentLike(
  commentId: string,
  userEmail: string,
): Promise<CommentLikeState> {
  const response: ApiResponse<CommentLikeState> = await postJson(
    `/comments/${encodeURIComponent(commentId)}/like`,
    { userEmail },
  );

  return response.data;
}

export async function fetchLeaderboard(options: Signal = {}): Promise<LeaderboardEntry[]> {
  const response: ApiResponse<LeaderboardEntry[]> = await getJson('/leaderboard', options);

  return response.data;
}
