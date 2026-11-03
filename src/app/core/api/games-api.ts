import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { catchError, map, type Observable, throwError, timeout } from 'rxjs';

import { toApiError } from './api-error';
import type {
  ApiResponse,
  CommentLikeState,
  CommentsMeta,
  CommentsQuery,
  FavoriteState,
  Game,
  GameCategory,
  GameComment,
  GameDetails,
  GamesMeta,
  GamesQuery,
  LeaderboardEntry,
  NewComment,
} from './models';

export const API_BASE_URL: InjectionToken<string> = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: (): string => 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api',
});

/**
 * A mutation that takes longer than this is given up; its result on the server is unknown then.
 */
export const MUTATION_TIMEOUT_MS: number = 15_000;

type QueryValue = string | number | boolean | undefined;

function toQueryParameters(query: Readonly<Record<string, QueryValue>>): HttpParams {
  let parameters: HttpParams = new HttpParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      parameters = parameters.set(key, String(value));
    }
  }

  return parameters;
}

function gamePath(slug: string): string {
  return `/games/${encodeURIComponent(slug)}`;
}

function fail(error: unknown): Observable<never> {
  return throwError(() => toApiError(error));
}

/**
 * The MiniGames REST API. Every method fails with an ApiError; reading requests are cancelled by
 * unsubscribing (a newer request of the same section replaces the older one), mutations are given
 * up after `MUTATION_TIMEOUT_MS` and are never repeated automatically.
 */
@Injectable({ providedIn: 'root' })
export class GamesApi {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl: string = inject(API_BASE_URL);

  private get<T>(path: string, query: Readonly<Record<string, QueryValue>> = {}): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { params: toQueryParameters(query) })
      .pipe(catchError(fail));
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body)
      .pipe(timeout(MUTATION_TIMEOUT_MS), catchError(fail));
  }

  categories(): Observable<GameCategory[]> {
    return this.get<ApiResponse<GameCategory[]>>('/categories').pipe(
      map((response: ApiResponse<GameCategory[]>) => response.data),
    );
  }

  games(query: GamesQuery): Observable<ApiResponse<Game[], GamesMeta>> {
    return this.get<ApiResponse<Game[], GamesMeta>>('/games', { ...query });
  }

  /**
   * Featured games of the Home slider (the API ignores the other list parameters).
   */
  featuredGames(): Observable<Game[]> {
    return this.get<ApiResponse<Game[], GamesMeta>>('/games', { featured: true }).pipe(
      map((response: ApiResponse<Game[], GamesMeta>) => response.data),
    );
  }

  /**
   * `userEmail` personalizes `isLikedByCurrentUser`; guests omit it.
   */
  gameDetails(slug: string, userEmail?: string): Observable<GameDetails> {
    return this.get<ApiResponse<GameDetails>>(gamePath(slug), { userEmail }).pipe(
      map((response: ApiResponse<GameDetails>) => response.data),
    );
  }

  comments(
    slug: string,
    query: CommentsQuery,
  ): Observable<ApiResponse<GameComment[], CommentsMeta>> {
    return this.get<ApiResponse<GameComment[], CommentsMeta>>(`${gamePath(slug)}/comments`, {
      ...query,
    });
  }

  leaderboard(): Observable<LeaderboardEntry[]> {
    return this.get<ApiResponse<LeaderboardEntry[]>>('/leaderboard').pipe(
      map((response: ApiResponse<LeaderboardEntry[]>) => response.data),
    );
  }

  /**
   * Adds the game to the user's favorites or removes it: every successful call flips the state.
   */
  toggleFavorite(slug: string, userEmail: string): Observable<FavoriteState> {
    return this.post<ApiResponse<FavoriteState>>(`${gamePath(slug)}/favorite`, { userEmail }).pipe(
      map((response: ApiResponse<FavoriteState>) => response.data),
    );
  }

  postComment(slug: string, comment: NewComment): Observable<GameComment> {
    return this.post<ApiResponse<GameComment>>(`${gamePath(slug)}/comments`, comment).pipe(
      map((response: ApiResponse<GameComment>) => response.data),
    );
  }

  /**
   * Likes the comment or takes the like back: every successful call flips the state.
   */
  toggleCommentLike(commentId: string, userEmail: string): Observable<CommentLikeState> {
    return this.post<ApiResponse<CommentLikeState>>(
      `/comments/${encodeURIComponent(commentId)}/like`,
      { userEmail },
    ).pipe(map((response: ApiResponse<CommentLikeState>) => response.data));
  }
}
