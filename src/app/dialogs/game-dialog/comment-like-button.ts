import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  type InputSignal,
  linkedSignal,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { GamesApi } from '@/core/api/games-api';
import type { CommentLikeState, GameComment } from '@/core/api/models';
import type { AppSession } from '@/core/auth/session';
import { Session } from '@/core/auth/session.service';
import { Icon } from '@/shared/ui/icon/icon';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { describeFailure } from './action-failure';

/**
 * Like / unlike a comment. Only signed-in users can use it (a guest gets Auth); the count and the
 * pressed state change only from the server answer, and the button stays locked while the request
 * runs, so a toggle is never sent twice or repeated automatically.
 */
@Component({
  selector: 'app-comment-like-button',
  imports: [Icon, TranslocoPipe],
  template: `
    <button
      class="like"
      type="button"
      [attr.aria-pressed]="state().isLikedByCurrentUser"
      [attr.aria-busy]="isPending()"
      [attr.aria-label]="
        'commentLike.label'
          | transloco
            : {
                count: state().likesCount,
                liked: state().isLikedByCurrentUser ? 'yes' : 'no',
                author: comment().authorName,
              }
      "
      [disabled]="isPending()"
      (click)="toggle()"
    >
      @if (isPending()) {
        <span class="spinner like__spinner" aria-hidden="true"></span>
      } @else {
        <app-icon class="like__icon" name="heartFilled" />
      }
      <span aria-hidden="true">{{ state().likesCount }}</span>
    </button>
  `,
  styleUrl: './comment-like-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentLikeButton {
  private readonly api: GamesApi = inject(GamesApi);
  private readonly session: Session = inject(Session);
  private readonly snackbar: Snackbar = inject(Snackbar);
  private readonly transloco: TranslocoService = inject(TranslocoService);

  /**
   * The comment as loaded for the current user (`isLikedByCurrentUser`).
   */
  readonly comment: InputSignal<GameComment> = input.required<GameComment>();

  protected readonly state: WritableSignal<CommentLikeState> = linkedSignal(() => ({
    isLikedByCurrentUser: this.comment().isLikedByCurrentUser,
    likesCount: this.comment().likesCount,
  }));
  protected readonly isPending: WritableSignal<boolean> = signal(false);

  protected async toggle(): Promise<void> {
    const session: AppSession | undefined = this.session.require('commentLike.guest');

    if (session === undefined || this.isPending()) {
      return;
    }

    this.isPending.set(true);

    try {
      const state: CommentLikeState = await firstValueFrom(
        this.api.toggleCommentLike(this.comment().commentId, session.email),
      );

      this.state.set(state);
    } catch (error: unknown) {
      this.snackbar.show(
        describeFailure(error, 'commentLike.failed', 'commentLike.unknown', (key: string) =>
          this.transloco.translate(key),
        ),
      );
    } finally {
      this.isPending.set(false);
    }
  }
}
