// Shapes of the MiniGames REST API (https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api).

export type SortValue = 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
export type CommentsSort = 'newest' | 'oldest';

export interface ApiResponse<T, M = undefined> {
  data: T;
  meta: M;
}

export interface Game {
  slug: string;
  name: string;
  /**
   * Slug of the category, e.g. `puzzle`.
   */
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
}

export interface GameCategory {
  slug: string;
  label: string;
  isDefault: boolean;
}

export interface TopRecord {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameDetails {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: {
    genre: string;
    players: string;
    duration: string;
    price: string;
  };
  topRecords: TopRecord[];
}

export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
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

export interface CommentsQuery {
  limit: number;
  sort?: CommentsSort;
  /**
   * The signed-in user: personalizes `isLikedByCurrentUser` of every comment. Guests omit it.
   */
  userEmail?: string | undefined;
}

export interface CommentsMeta {
  totalComments: number;
  returnedCount: number;
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
