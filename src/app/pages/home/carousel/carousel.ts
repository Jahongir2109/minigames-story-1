import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  type OutputEmitterRef,
  type ResourceRef,
  type Signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';

import { getErrorKey } from '@/core/api/api-error';
import { GamesApi } from '@/core/api/games-api';
import type { Game } from '@/core/api/models';
import { reportFailures } from '@/shared/data/report-failures';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';
import { ErrorBanner } from '@/shared/ui/error-banner/error-banner';
import { Icon } from '@/shared/ui/icon/icon';
import { SectionTitle } from '@/shared/ui/section-title/section-title';

import { Slider } from './slider';

// Placeholder cards while the featured games load (only the middle one is shown on mobile).
const SKELETON_CARDS: readonly number[] = [1, 2, 3];

/**
 * "New Games" section: the featured games come from the API; the slider area shows a skeleton
 * while they load, an error banner with Retry when the request fails and a placeholder when the
 * list is empty.
 */
@Component({
  selector: 'app-carousel',
  imports: [EmptyState, ErrorBanner, Icon, SectionTitle, Slider, TranslocoPipe],
  template: `
    <section class="carousel" aria-labelledby="new-games-title">
      <div class="carousel__inner">
        <div class="carousel__header">
          <app-section-title headingId="new-games-title">
            {{ 'carousel.title' | transloco }}
          </app-section-title>
          @if (hasGames()) {
            <div class="carousel__controls">
              <button
                class="carousel__control carousel__control--previous"
                type="button"
                [attr.aria-label]="'carousel.previous' | transloco"
                (click)="slider()?.previous()"
              >
                <app-icon class="carousel__control-icon" name="arrowBack" />
              </button>
              <button
                class="carousel__control carousel__control--next"
                type="button"
                [attr.aria-label]="'carousel.next' | transloco"
                (click)="slider()?.next()"
              >
                <app-icon class="carousel__control-icon" name="arrowForward" />
              </button>
            </div>
          }
        </div>
        <div class="carousel__body">
          @if (games.isLoading()) {
            <div
              class="carousel__skeleton"
              role="status"
              aria-busy="true"
              [attr.aria-label]="'carousel.loading' | transloco"
            >
              @for (card of skeletonCards; track card) {
                <span
                  class="skeleton skeleton--block carousel__skeleton-card"
                  aria-hidden="true"
                ></span>
              }
            </div>
          } @else if (games.error(); as error) {
            <app-error-banner
              [title]="'carousel.failed' | transloco"
              [message]="errorKey(error) | transloco"
              (retry)="games.reload()"
            />
          } @else if (hasGames()) {
            <app-slider [games]="games.value() ?? []" (openGame)="openGame.emit($event)" />
          } @else {
            <app-empty-state
              [title]="'carousel.emptyTitle' | transloco"
              [message]="'carousel.emptyMessage' | transloco"
            />
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel {
  private readonly api: GamesApi = inject(GamesApi);

  /**
   * A card was clicked: it opens the Game Details dialog.
   */
  readonly openGame: OutputEmitterRef<Game> = output<Game>();

  protected readonly games: ResourceRef<Game[] | undefined> = rxResource({
    stream: () => this.api.featuredGames(),
  });
  protected readonly slider: Signal<Slider | undefined> = viewChild(Slider);
  protected readonly skeletonCards: readonly number[] = SKELETON_CARDS;

  constructor() {
    reportFailures(this.games, 'carousel.failedNotice');
  }

  protected hasGames(): boolean {
    return this.games.hasValue() && this.games.value().length > 0;
  }

  protected errorKey(error: unknown): string {
    return getErrorKey(error);
  }
}
