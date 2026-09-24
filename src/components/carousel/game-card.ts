import './game-card.scss';

import heartIcon from '@/assets/icons/heart.svg?raw';
import starIcon from '@/assets/icons/star.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { Game } from '@/shared/types/game';
import { formatCount, formatRating } from '@/shared/utils/format';

export interface GameCardOptions {
  game: Game;
  /**
   * Makes the whole card a button (it opens the Game Details dialog).
   */
  onOpen?: () => void;
}

function createMetric(icon: string, modifier: string, value: string): HTMLElement {
  const iconElement: SVGElement = createIcon(icon, 'game-card__metric-icon');
  const text: HTMLSpanElement = createElement('span', { text: value });

  return createElement('span', {
    className: `game-card__metric game-card__metric--${modifier}`,
    children: [iconElement, text],
  });
}

export function createGameCard(options: GameCardOptions): HTMLElement {
  const { game } = options;

  const image: HTMLImageElement = createElement('img', {
    className: 'game-card__image',
    attributes: {
      src: game.cardImage,
      alt: `${game.name} cover`,
      loading: 'lazy',
      draggable: 'false',
    },
  });
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-card__title',
    text: game.name,
  });
  const metrics: HTMLElement = createElement('div', {
    className: 'game-card__metrics',
    children: [
      createMetric(starIcon, 'rating', formatRating(game.rating)),
      createMetric(heartIcon, 'likes', formatCount(game.likesCount)),
    ],
  });
  // Shown only when the card is at least 288px wide (container query in the styles).
  const overlay: HTMLElement = createElement('div', {
    className: 'game-card__overlay',
    children: [title, metrics],
  });
  const card: HTMLElement = createElement('article', {
    className: 'game-card',
    children: [image, overlay],
  });

  if (options.onOpen !== undefined) {
    // A button can not contain the article, so it is stretched over the whole card instead.
    const openButton: HTMLButtonElement = createElement('button', {
      className: 'game-card__open',
      attributes: { type: 'button', 'aria-label': `${game.name}: open details` },
    });

    openButton.addEventListener('click', options.onOpen);
    card.append(openButton);
  }

  return card;
}
