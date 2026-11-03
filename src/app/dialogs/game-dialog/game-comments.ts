import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  type InputSignal,
  type ResourceRef,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';

import { getErrorKey } from '@/core/api/api-error';
import { GamesApi } from '@/core/api/games-api';
import type { ApiResponse, CommentsMeta, GameComment } from '@/core/api/models';
import { reportFailures } from '@/shared/data/report-failures';
import { RelativeTimePipe } from '@/shared/format/format.pipes';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';
import { ErrorBanner } from '@/shared/ui/error-banner/error-banner';
import { Icon } from '@/shared/ui/icon/icon';

import {
  type AvatarColorPicker,
  createAvatarColorPicker,
  getAvatarInitial,
} from './comment-avatar';

// The latest comments shown in the dialog.
export const COMMENTS_LIMIT: number = 3;
const SKELETON_ITEMS: readonly number[] = [1, 2, 3];

interface CommentsRequest {
  slug: string;
  userEmail: string | undefined;
}

/**
 * Comments section of the Game Details dialog: the latest comments and the total count come from
 * the API, with the like state of the signed-in user.
 */
@Component({
  selector: 'app-game-comments',
  imports: [EmptyState, ErrorBanner, Icon, RelativeTimePipe, TranslocoPipe],
  template: `
    <section class="game-comments" aria-labelledby="game-comments-title">
      <h3 class="game-comments__title" id="game-comments-title">
        @if (comments.hasValue()) {
          {{
            'gameDialog.commentsCount' | transloco: { count: comments.value().meta.totalComments }
          }}
        } @else {
          {{ 'gameDialog.comments' | transloco }}
        }
      </h3>
      <ng-content />
      @if (comments.isLoading()) {
        <div
          class="game-comments__list"
          role="status"
          aria-busy="true"
          [attr.aria-label]="'gameDialog.loadingComments' | transloco"
        >
          @for (item of skeletonItems; track item) {
            <span
              class="skeleton skeleton--block game-comments__skeleton"
              aria-hidden="true"
            ></span>
          }
        </div>
      } @else if (comments.error(); as error) {
        <app-error-banner
          [title]="'gameDialog.commentsFailed' | transloco"
          [message]="errorKey(error) | transloco"
          (retry)="comments.reload()"
        />
      } @else if (comments.hasValue() && comments.value().data.length > 0) {
        <ul class="game-comments__list">
          @for (comment of comments.value().data; track comment.commentId) {
            <li>
              <article class="game-comments__card">
                <header class="game-comments__card-header">
                  <h4 class="game-comments__author">
                    <span
                      class="game-comments__avatar"
                      aria-hidden="true"
                      [class]="'game-comments__avatar--' + avatarColor(comment.authorName)"
                    >
                      {{ initial(comment.authorName) }}
                    </span>
                    {{ comment.authorName }}
                  </h4>
                  <time class="game-comments__date" [attr.datetime]="comment.createdAt">
                    {{ comment.createdAt | relativeTime }}
                  </time>
                </header>
                <p class="game-comments__text">{{ comment.text }}</p>
                <p
                  class="game-comments__like"
                  [attr.aria-label]="'gameDialog.likes' | transloco: { count: comment.likesCount }"
                >
                  <app-icon class="game-comments__like-icon" name="heartFilled" />
                  <span aria-hidden="true">{{ comment.likesCount }}</span>
                </p>
              </article>
            </li>
          }
        </ul>
      } @else {
        <app-empty-state
          [title]="'gameDialog.noCommentsTitle' | transloco"
          [message]="'gameDialog.noCommentsMessage' | transloco"
        />
      }
    </section>
  `,
  styleUrl: './game-comments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComments {
  private readonly api: GamesApi = inject(GamesApi);
  // One color per commenter for as long as this section is shown.
  private readonly pickAvatarColor: AvatarColorPicker = createAvatarColorPicker();

  readonly slug: InputSignal<string> = input.required<string>();
  /**
   * The signed-in user: personalizes the like state of every comment. Guests have none.
   */
  readonly userEmail: InputSignal<string | undefined> = input<string>();

  protected readonly comments: ResourceRef<ApiResponse<GameComment[], CommentsMeta> | undefined> =
    rxResource({
      params: (): CommentsRequest => ({ slug: this.slug(), userEmail: this.userEmail() }),
      stream: ({ params }: { params: CommentsRequest }) =>
        this.api.comments(params.slug, {
          limit: COMMENTS_LIMIT,
          sort: 'newest',
          userEmail: params.userEmail,
        }),
    });
  protected readonly skeletonItems: readonly number[] = SKELETON_ITEMS;

  constructor() {
    reportFailures(this.comments, 'gameDialog.commentsFailedNotice');
  }

  /**
   * Loads the latest comments again (e.g. after the user posted one).
   */
  reload(): void {
    this.comments.reload();
  }

  protected errorKey(error: unknown): string {
    return getErrorKey(error);
  }

  protected initial(name: string): string {
    return getAvatarInitial(name);
  }

  protected avatarColor(name: string): string {
    return this.pickAvatarColor(name);
  }
}
