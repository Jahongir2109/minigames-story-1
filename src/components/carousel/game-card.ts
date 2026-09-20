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
   * The card in the middle of the carousel always shows its information.
   */
  active: boolean;
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
  const { game, active } = options;

  const image: HTMLImageElement = createElement('img', {
    className: 'game-card__image',
    attributes: { src: game.cardImage, alt: `${game.name} cover`, loading: 'lazy' },
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
  const overlay: HTMLElement = createElement('div', {
    className: 'game-card__overlay',
    children: [title, metrics],
  });

  return createElement('article', {
    className: active ? 'game-card game-card--active' : 'game-card',
    children: [image, overlay],
  });
}
