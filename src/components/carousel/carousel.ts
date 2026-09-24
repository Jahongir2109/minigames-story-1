import './carousel.scss';

import arrowBackIcon from '@/assets/icons/arrow-back.svg?raw';
import arrowForwardIcon from '@/assets/icons/arrow-forward.svg?raw';
import { createSectionTitle } from '@/components/section-title/section-title';
import { featuredGames } from '@/data/games';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { Game } from '@/shared/types/game';

import { type AutoplayTimer, createAutoplayTimer } from './autoplay-timer';
import {
  type CardPlacement,
  type CarouselLayout,
  computeLayout,
  getLoopOffset,
  placeCard,
} from './carousel-layout';
import { createGameCard } from './game-card';

const TITLE_ID: string = 'new-games-title';
const AUTOPLAY_INTERVAL: number = 4000;
// Pointer travel (px) that turns a press into a swipe.
const DRAG_THRESHOLD: number = 6;
// A swipe this long always moves at least one card, even before the half-step point.
const SWIPE_THRESHOLD: number = 40;
const INSTANT_CLASS: string = 'carousel__item--instant';

export interface CarouselOptions {
  /**
   * Called when a card is clicked: every card opens the Game Details dialog.
   */
  onGameDetails: (game: Game) => void;
}

function createControl(
  label: string,
  icon: string,
  variant: 'previous' | 'next',
): HTMLButtonElement {
  return createElement('button', {
    className: `carousel__control carousel__control--${variant}`,
    attributes: { type: 'button', 'aria-label': label },
    children: [createIcon(icon, 'carousel__control-icon')],
  });
}

/**
 * "New Games" slider: an endless loop of the featured games that moves with the arrows, a swipe
 * and autoplay (one card every 4 seconds). Cards grow towards the middle.
 */
export function createCarousel(options: CarouselOptions): HTMLElement {
  const games: readonly Game[] = featuredGames;
  const count: number = games.length;

  const previousButton: HTMLButtonElement = createControl(
    'Previous game',
    arrowBackIcon,
    'previous',
  );
  const nextButton: HTMLButtonElement = createControl('Next game', arrowForwardIcon, 'next');
  const items: HTMLLIElement[] = games.map((game: Game, index: number): HTMLLIElement =>
    createElement('li', {
      className: 'carousel__item',
      attributes: { 'aria-label': `${String(index + 1)} of ${String(count)}` },
      children: [
        createGameCard({
          game,
          onOpen: (): void => {
            options.onGameDetails(game);
          },
        }),
      ],
    }),
  );
  const track: HTMLUListElement = createElement('ul', {
    className: 'carousel__track',
    attributes: { 'aria-label': 'New games' },
    children: items,
  });
  const header: HTMLElement = createElement('div', {
    className: 'carousel__header',
    children: [
      createSectionTitle('New Games', TITLE_ID),
      createElement('div', {
        className: 'carousel__controls',
        children: [previousButton, nextButton],
      }),
    ],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'carousel__inner',
    children: [header, track],
  });
  const element: HTMLElement = createElement('section', {
    className: 'carousel',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });

  // Index of the card in the middle; fractional while the user drags.
  let position: number = 0;
  let layout: CarouselLayout = computeLayout(0, innerWidth);
  const previousOffsets: number[] = items.map((_: HTMLLIElement, index: number): number =>
    getLoopOffset(index, position, count),
  );

  const render = (isAnimated: boolean): void => {
    for (const [index, item] of items.entries()) {
      const offset: number = getLoopOffset(index, position, count);
      const placement: CardPlacement = placeCard(layout, offset);
      // A card that wraps around the loop jumps between the two parking slots; animating that
      // jump would sweep it across the whole track.
      const isWrapping: boolean = Math.abs(offset - (previousOffsets[index] ?? offset)) > count / 2;

      item.classList.toggle(INSTANT_CLASS, !isAnimated || isWrapping);
      item.style.transform = `translateX(${String(placement.x)}px)`;
      item.style.width = `${String(placement.width)}px`;
      item.inert = !placement.isVisible;
      previousOffsets[index] = offset;
    }
  };

  const goTo = (target: number): void => {
    position = ((Math.round(target) % count) + count) % count;
    render(true);
  };

  const timer: AutoplayTimer = createAutoplayTimer(AUTOPLAY_INTERVAL, (): void => {
    // The Home page is rebuilt on every visit, so a detached slider retires itself.
    if (!element.isConnected) {
      timer.stop();
      resizeObserver.disconnect();
      return;
    }

    // Autoplay moves from right to left: the next card slides into the middle.
    goTo(position + 1);
  });

  previousButton.addEventListener('click', (): void => {
    goTo(position - 1);
    timer.restart();
  });
  nextButton.addEventListener('click', (): void => {
    goTo(position + 1);
    timer.restart();
  });

  // ------------------------------------------------------ Press, hold and swipe
  let pointerId: number | undefined;
  let startX: number = 0;
  let startPosition: number = 0;
  let isDragging: boolean = false;
  let shouldSuppressClick: boolean = false;

  track.addEventListener('pointerdown', (event: PointerEvent): void => {
    if (pointerId !== undefined || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    startPosition = position;
    isDragging = false;
    // Holding the slider freezes autoplay.
    timer.pause();
  });

  track.addEventListener('pointermove', (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) {
      return;
    }

    const distance: number = event.clientX - startX;

    if (!isDragging && Math.abs(distance) > DRAG_THRESHOLD) {
      isDragging = true;
      track.setPointerCapture(event.pointerId);
      track.classList.add('carousel__track--dragging');
    }

    if (!isDragging) {
      return;
    }

    position = startPosition - distance / layout.step;
    render(false);
  });

  const endPointer = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) {
      return;
    }

    pointerId = undefined;
    track.classList.remove('carousel__track--dragging');

    if (!isDragging) {
      // Released without a swipe: the countdown continues where it stopped.
      timer.resume();
      return;
    }

    const distance: number = event.clientX - startX;
    let target: number = Math.round(position);

    if (target === startPosition && Math.abs(distance) >= SWIPE_THRESHOLD) {
      target = startPosition - Math.sign(distance);
    }

    goTo(target);
    // A swipe starts a new full interval.
    timer.restart();

    // Swallow only the click the browser fires right after this pointerup.
    shouldSuppressClick = true;
    setTimeout((): void => {
      shouldSuppressClick = false;
    }, 0);
  };

  track.addEventListener('pointerup', endPointer);
  track.addEventListener('pointercancel', endPointer);

  track.addEventListener(
    'click',
    (event: MouseEvent): void => {
      if (!shouldSuppressClick) {
        return;
      }

      event.stopPropagation();
      shouldSuppressClick = false;
    },
    { capture: true },
  );

  // ------------------------------------------------------------------ Layout
  const applyLayout = (): void => {
    layout = computeLayout(track.clientWidth, innerWidth);
    track.dataset.layout = layout.name;
    render(false);
  };

  // Lays the cards out once the track is attached and whenever its width changes.
  const resizeObserver: ResizeObserver = new ResizeObserver(applyLayout);

  resizeObserver.observe(track);
  timer.restart();

  return element;
}
