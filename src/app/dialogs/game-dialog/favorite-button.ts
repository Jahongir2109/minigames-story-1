import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type InputSignal,
  linkedSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { GamesApi } from '@/core/api/games-api';
import type { FavoriteState } from '@/core/api/models';
import type { AppSession } from '@/core/auth/session';
import { Session } from '@/core/auth/session.service';
import { Icon } from '@/shared/ui/icon/icon';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { describeFailure } from './action-failure';

/**
 * Add to / Remove from Favorites. Only signed-in users can use it (a guest gets Auth); the state
 * changes only from the server answer, and the button stays locked while the request runs, so a
 * toggle is never sent twice or repeated automatically.
 */
@Component({
  selector: 'app-favorite-button',
  imports: [Icon, TranslocoPipe],
  template: `
    <button
      class="favorite"
      type="button"
      [attr.aria-pressed]="isFavorited()"
      [attr.aria-label]="label() | transloco"
      [attr.aria-busy]="isPending()"
      [disabled]="isPending()"
      (click)="toggle()"
    >
      @if (isPending()) {
        <span class="spinner" aria-hidden="true"></span>
      } @else {
        <app-icon class="favorite__icon" name="heartFilled" />
      }
      <!-- Icon-only on mobile, so the button keeps its accessible name in aria-label. -->
      <span class="favorite__label" aria-hidden="true">{{ label() | transloco }}</span>
    </button>
  `,
  styleUrl: './favorite-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButton {
  private readonly api: GamesApi = inject(GamesApi);
  private readonly session: Session = inject(Session);
  private readonly snackbar: Snackbar = inject(Snackbar);
  private readonly transloco: TranslocoService = inject(TranslocoService);

  readonly slug: InputSignal<string> = input.required<string>();
  /**
   * The state of the signed-in user from the game details (`isLikedByCurrentUser`).
   */
  readonly favorited: InputSignal<boolean> = input.required<boolean>();
  /**
   * The like count that the server returned with the new state.
   */
  readonly likesChange: OutputEmitterRef<number> = output<number>();

  protected readonly isFavorited: WritableSignal<boolean> = linkedSignal(() => this.favorited());
  protected readonly isPending: WritableSignal<boolean> = signal(false);
  protected readonly label: Signal<string> = computed(() =>
    this.isFavorited() ? 'favorite.remove' : 'favorite.add',
  );

  protected async toggle(): Promise<void> {
    const session: AppSession | undefined = this.session.require('favorite.guest');

    if (session === undefined || this.isPending()) {
      return;
    }

    this.isPending.set(true);

    try {
      const state: FavoriteState = await firstValueFrom(
        this.api.toggleFavorite(this.slug(), session.email),
      );

      this.isFavorited.set(state.isFavorited);
      this.likesChange.emit(state.likesCount);
      this.snackbar.show({
        message: state.isFavorited ? 'favorite.added' : 'favorite.removed',
        variant: 'success',
      });
    } catch (error: unknown) {
      this.snackbar.show(
        describeFailure(error, 'favorite.failed', 'favorite.unknown', (key: string) =>
          this.transloco.translate(key),
        ),
      );
    } finally {
      this.isPending.set(false);
    }
  }
}
