import { ChangeDetectionStrategy, Component, input, type InputSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { GameDetails } from '@/core/api/models';
import { CompactCountPipe, RatingPipe } from '@/shared/format/format.pipes';
import { Icon } from '@/shared/ui/icon/icon';

const FREE_PRICE: string = 'Free';

interface Spec {
  /**
   * Translation key of the label.
   */
  label: string;
  value: string;
  /**
   * Translation key that replaces the value of the API (the free price).
   */
  translated?: string;
}

/**
 * Title, rating, likes, description, characteristics and the actions of the game. "Play Now" does
 * nothing yet; the favorite button is projected into the actions.
 */
@Component({
  selector: 'app-game-info',
  imports: [CompactCountPipe, Icon, RatingPipe, TranslocoPipe],
  template: `
    <section class="game-info" [attr.aria-labelledby]="titleId()">
      <div class="game-info__heading">
        <h2 class="game-info__title" [id]="titleId()">{{ game().name }}</h2>
        <div class="game-info__stats">
          <p class="game-info__stat game-info__stat--rating">
            <app-icon class="game-info__stat-icon" name="starFilled" />
            <span class="visually-hidden">{{ 'library.rating' | transloco }}</span>
            {{ game().rating | rating }}
          </p>
          <p class="game-info__stat game-info__stat--likes">
            <app-icon class="game-info__stat-icon" name="heartFilled" />
            <span class="visually-hidden">{{ 'library.likes' | transloco }}</span>
            {{ likesCount() ?? game().likesCount | compactCount }}
          </p>
        </div>
      </div>
      <p class="game-info__description">{{ game().fullDescription }}</p>
      <dl class="game-info__specs">
        @for (spec of specs(); track spec.label) {
          <div class="game-info__spec">
            <dt>{{ spec.label | transloco }}</dt>
            <dd>{{ spec.translated ? (spec.translated | transloco) : spec.value }}</dd>
          </div>
        }
      </dl>
      <div class="game-info__actions">
        <button class="game-info__play" type="button">{{ 'gameDialog.play' | transloco }}</button>
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './game-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameInfo {
  readonly game: InputSignal<GameDetails> = input.required<GameDetails>();
  readonly titleId: InputSignal<string> = input.required<string>();
  /**
   * The like count that the server returned with the last favorite change.
   */
  readonly likesCount: InputSignal<number | null> = input<number | null>(null);

  protected specs(): readonly Spec[] {
    const { genre, players, duration, price } = this.game().specs;

    return [
      { label: 'gameDialog.genre', value: genre },
      { label: 'gameDialog.players', value: players },
      { label: 'gameDialog.duration', value: duration },
      {
        label: 'gameDialog.price',
        value: price,
        ...(price === FREE_PRICE && { translated: 'library.free' }),
      },
    ];
  }
}
