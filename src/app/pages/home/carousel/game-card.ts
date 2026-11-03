import {
  ChangeDetectionStrategy,
  Component,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { Game } from '@/core/api/models';
import { CompactCountPipe, RatingPipe } from '@/shared/format/format.pipes';
import { Icon } from '@/shared/ui/icon/icon';

/**
 * Card of the "New Games" slider. Cards that are wide enough show the name, the rating and the
 * likes (container query); the whole card is a button that opens the Game Details dialog.
 */
@Component({
  selector: 'app-game-card',
  imports: [CompactCountPipe, Icon, RatingPipe, TranslocoPipe],
  template: `
    <article class="game-card">
      <img
        class="game-card__image"
        loading="lazy"
        draggable="false"
        [src]="game().cardImage"
        [alt]="'carousel.cover' | transloco: { name: game().name }"
      />
      <div class="game-card__overlay">
        <h3 class="game-card__title">{{ game().name }}</h3>
        <div class="game-card__metrics">
          <span class="game-card__metric game-card__metric--rating">
            <app-icon class="game-card__metric-icon" name="star" />
            <span>{{ game().rating | rating }}</span>
          </span>
          <span class="game-card__metric game-card__metric--likes">
            <app-icon class="game-card__metric-icon" name="heart" />
            <span>{{ game().likesCount | compactCount }}</span>
          </span>
        </div>
      </div>
      <!-- A button can not contain the article, so it is stretched over the whole card. -->
      <button
        class="game-card__open"
        type="button"
        [attr.aria-label]="'carousel.open' | transloco: { name: game().name }"
        (click)="open.emit()"
      ></button>
    </article>
  `,
  styleUrl: './game-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCard {
  readonly game: InputSignal<Game> = input.required<Game>();
  readonly open: OutputEmitterRef<void> = output();
}
