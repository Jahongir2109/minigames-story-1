import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { Game } from '@/core/api/models';

import { type AutoplayTimer, createAutoplayTimer } from './autoplay-timer';
import {
  type CardPlacement,
  type CarouselLayout,
  type CarouselLayoutName,
  computeLayout,
  getLoopOffset,
  placeCard,
} from './carousel-layout';
import { GameCard } from './game-card';

export const AUTOPLAY_INTERVAL: number = 4000;
// Pointer travel (px) that turns a press into a swipe.
const DRAG_THRESHOLD: number = 6;
// A swipe this long always moves at least one card, even before the half-step point.
const SWIPE_THRESHOLD: number = 40;

interface ItemPlacement extends CardPlacement {
  /**
   * Moved without the transition: while dragging, on a resize and when the card wraps around
   * the loop (animating that jump would sweep it across the whole track).
   */
  isInstant: boolean;
}

/**
 * The "New Games" slider: an endless loop of the featured games that moves with the arrows, a
 * swipe and autoplay (one card every 4 seconds, frozen while the slider is held). The cards sit
 * on the keylines of a Material 3 multi-browse layout and grow towards the middle.
 */
@Component({
  selector: 'app-slider',
  imports: [GameCard, TranslocoPipe],
  template: `
    <ul
      #track
      class="carousel__track"
      [class.carousel__track--dragging]="isDragging()"
      [attr.data-layout]="layoutName()"
      [attr.aria-label]="'carousel.region' | transloco"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
    >
      @for (game of games(); track game.slug; let index = $index) {
        @let placement = placements()[index];
        <li
          class="carousel__item"
          [class.carousel__item--instant]="placement?.isInstant ?? true"
          [style.transform]="'translateX(' + (placement?.x ?? 0) + 'px)'"
          [style.width.px]="placement?.width ?? 0"
          [inert]="!(placement?.isVisible ?? false)"
          [attr.aria-label]="
            'carousel.slide' | transloco: { index: index + 1, count: games().length }
          "
        >
          <app-game-card [game]="game" (open)="openGame.emit(game)" />
        </li>
      }
    </ul>
  `,
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Slider {
  private readonly window: (Window & typeof globalThis) | null = inject(DOCUMENT).defaultView;
  private readonly track: Signal<ElementRef<HTMLUListElement>> =
    viewChild.required<ElementRef<HTMLUListElement>>('track');
  private readonly timer: AutoplayTimer = createAutoplayTimer(AUTOPLAY_INTERVAL, () => {
    // Autoplay moves from right to left: the next card slides into the middle.
    this.goTo(this.position + 1);
  });

  // Index of the card in the middle; fractional while the user drags.
  private position: number = 0;
  private layout: CarouselLayout = computeLayout(0, this.window?.innerWidth ?? 0);
  private readonly previousOffsets: number[] = [];

  // Press, hold and swipe.
  private pointerId: number | undefined;
  private startX: number = 0;
  private startPosition: number = 0;
  private shouldSuppressClick: boolean = false;

  // Swallows only the click that the browser fires right after a swipe.
  private readonly suppressClick = (event: MouseEvent): void => {
    if (!this.shouldSuppressClick) {
      return;
    }

    event.stopPropagation();
    this.shouldSuppressClick = false;
  };

  readonly games: InputSignal<readonly Game[]> = input.required<readonly Game[]>();
  /**
   * A card was clicked: it opens the Game Details dialog.
   */
  readonly openGame: OutputEmitterRef<Game> = output<Game>();

  protected readonly placements: WritableSignal<readonly ItemPlacement[]> = signal([]);
  protected readonly layoutName: WritableSignal<CarouselLayoutName> = signal(this.layout.name);
  protected readonly isDragging: WritableSignal<boolean> = signal(false);

  constructor() {
    let observer: ResizeObserver | undefined;

    // Lays the cards out once the track is rendered and whenever its width changes.
    afterNextRender(() => {
      const track: HTMLUListElement = this.track().nativeElement;

      observer = new ResizeObserver(() => {
        this.applyLayout();
      });
      observer.observe(track);
      // Swallows only the click that the browser fires right after a swipe.
      track.addEventListener('click', this.suppressClick, { capture: true });
      this.applyLayout();
      this.timer.restart();
    });

    inject(DestroyRef).onDestroy(() => {
      this.timer.stop();
      observer?.disconnect();
      this.track().nativeElement.removeEventListener('click', this.suppressClick, {
        capture: true,
      });
    });
  }

  private applyLayout(): void {
    this.layout = computeLayout(
      this.track().nativeElement.clientWidth,
      this.window?.innerWidth ?? 0,
    );
    this.layoutName.set(this.layout.name);
    this.render(false);
  }

  private render(isAnimated: boolean): void {
    const count: number = this.games().length;

    this.placements.set(
      this.games().map((_: Game, index: number): ItemPlacement => {
        const offset: number = getLoopOffset(index, this.position, count);
        const isWrapping: boolean =
          Math.abs(offset - (this.previousOffsets[index] ?? offset)) > count / 2;

        this.previousOffsets[index] = offset;

        return { ...placeCard(this.layout, offset), isInstant: !isAnimated || isWrapping };
      }),
    );
  }

  private goTo(target: number): void {
    const count: number = this.games().length;

    this.position = ((Math.round(target) % count) + count) % count;
    this.render(true);
  }

  previous(): void {
    this.goTo(this.position - 1);
    this.timer.restart();
  }

  next(): void {
    this.goTo(this.position + 1);
    this.timer.restart();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.pointerId !== undefined || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startPosition = this.position;
    this.isDragging.set(false);
    // Holding the slider freezes autoplay.
    this.timer.pause();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    const distance: number = event.clientX - this.startX;

    if (!this.isDragging() && Math.abs(distance) > DRAG_THRESHOLD) {
      this.isDragging.set(true);
      this.track().nativeElement.setPointerCapture(event.pointerId);
    }

    if (!this.isDragging()) {
      return;
    }

    this.position = this.startPosition - distance / this.layout.step;
    this.render(false);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    this.pointerId = undefined;

    if (!this.isDragging()) {
      // Released without a swipe: the countdown continues where it stopped.
      this.timer.resume();
      return;
    }

    this.isDragging.set(false);

    const distance: number = event.clientX - this.startX;
    let target: number = Math.round(this.position);

    if (target === this.startPosition && Math.abs(distance) >= SWIPE_THRESHOLD) {
      target = this.startPosition - Math.sign(distance);
    }

    this.goTo(target);
    // A swipe starts a new full interval.
    this.timer.restart();
    this.shouldSuppressClick = true;
    setTimeout(() => {
      this.shouldSuppressClick = false;
    }, 0);
  }
}
