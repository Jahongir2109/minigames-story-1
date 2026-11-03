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
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';

import { CategoryLabelPipe } from '../category-label.pipe';

const FREE_PRICE: string = 'Free';

/**
 * Game card of the Library list: vertical on mobile, image on the left from the tablet layout.
 * The game data comes from the API as it is; the category badge and the labels are translated.
 */
@Component({
  selector: 'app-library-card',
  imports: [Button, CategoryLabelPipe, CompactCountPipe, Icon, RatingPipe, TranslocoPipe],
  template: `
    <article class="library-card">
      <img
        class="library-card__image"
        loading="lazy"
        [src]="game().cardImage"
        [alt]="'carousel.cover' | transloco: { name: game().name }"
      />
      <div class="library-card__content">
        <div class="library-card__heading">
          <h2 class="library-card__title">{{ game().name }}</h2>
          <span class="library-card__badge">
            {{ game().category | categoryLabel: categoryLabel() }}
          </span>
        </div>
        <p class="library-card__price" [class.library-card__price--free]="isFree()">
          {{ isFree() ? ('library.free' | transloco) : game().price }}
        </p>
        <!-- The description is clamped with an ellipsis in CSS when it does not fit. -->
        <p class="library-card__description">{{ game().shortDescription }}</p>
        <div class="library-card__stats">
          <p class="library-card__stat library-card__stat--rating">
            <app-icon class="library-card__stat-icon" name="starFilled" />
            <span class="visually-hidden">{{ 'library.rating' | transloco }}</span>
            {{ game().rating | rating }}
          </p>
          <p class="library-card__stat library-card__stat--likes">
            <app-icon class="library-card__stat-icon" name="heartFilled" />
            <span class="visually-hidden">{{ 'library.likes' | transloco }}</span>
            {{ game().likesCount | compactCount }}
          </p>
        </div>
        <button
          class="library-card__details"
          type="button"
          appButton
          size="small"
          (click)="details.emit()"
        >
          {{ 'library.details' | transloco }}
        </button>
      </div>
    </article>
  `,
  styleUrl: './library-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block; height: 100%' },
})
export class LibraryCard {
  readonly game: InputSignal<Game> = input.required<Game>();
  /**
   * The English label of the API, used when the app has no translation of the category.
   */
  readonly categoryLabel: InputSignal<string | undefined> = input<string>();
  readonly details: OutputEmitterRef<void> = output();

  protected isFree(): boolean {
    return this.game().price === FREE_PRICE;
  }
}
