import './library-card.scss';

import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import starIcon from '@/assets/icons/star-filled.svg?raw';
import { createButton } from '@/components/ui/button/button';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { Game } from '@/shared/types/game';
import { formatCount, formatRating } from '@/shared/utils/format';

const FREE_PRICE: string = 'Free';

export interface LibraryCardOptions {
  game: Game;
  categoryLabel: string;
  onDetails: () => void;
}

function createStat(icon: string, modifier: string, label: string, value: string): HTMLElement {
  return createElement('p', {
    className: `library-card__stat library-card__stat--${modifier}`,
    children: [
      createIcon(icon, 'library-card__stat-icon'),
      createElement('span', { className: 'visually-hidden', text: label }),
      value,
    ],
  });
}

/**
 * Game card of the Library list: vertical on mobile, image on the left from the tablet layout.
 */
export function createLibraryCard(options: LibraryCardOptions): HTMLElement {
  const { game } = options;

  const image: HTMLImageElement = createElement('img', {
    className: 'library-card__image',
    attributes: { src: game.cardImage, alt: `${game.name} cover`, loading: 'lazy' },
  });
  const title: HTMLHeadingElement = createElement('h2', {
    className: 'library-card__title',
    text: game.name,
  });
  const badge: HTMLSpanElement = createElement('span', {
    className: 'library-card__badge',
    text: options.categoryLabel,
  });
  const price: HTMLParagraphElement = createElement('p', {
    className: `library-card__price${game.price === FREE_PRICE ? ' library-card__price--free' : ''}`,
    text: game.price,
  });
  // The description is clamped with an ellipsis in CSS when it does not fit.
  const description: HTMLParagraphElement = createElement('p', {
    className: 'library-card__description',
    text: game.shortDescription,
  });
  const stats: HTMLElement = createElement('div', {
    className: 'library-card__stats',
    children: [
      createStat(starIcon, 'rating', 'Rating', formatRating(game.rating)),
      createStat(heartIcon, 'likes', 'Likes', formatCount(game.likesCount)),
    ],
  });
  const detailsButton: HTMLButtonElement = createButton({
    label: 'Details',
    variant: 'primary',
    size: 'small',
    className: 'library-card__details',
  });

  detailsButton.addEventListener('click', options.onDetails);

  const heading: HTMLElement = createElement('div', {
    className: 'library-card__heading',
    children: [title, badge],
  });
  const content: HTMLElement = createElement('div', {
    className: 'library-card__content',
    children: [heading, price, description, stats, detailsButton],
  });

  return createElement('article', {
    className: 'library-card',
    children: [image, content],
  });
}
