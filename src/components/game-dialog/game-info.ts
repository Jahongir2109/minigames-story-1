import './game-info.scss';

import heartIcon from '@/assets/icons/heart-filled.svg?raw';
import starIcon from '@/assets/icons/star-filled.svg?raw';
import type { RequireSession } from '@/auth/session-guard';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { GameDetails } from '@/shared/types/game';
import { formatCount, formatRating } from '@/shared/utils/format';

import { createFavoriteButton } from './favorite-button';

interface Spec {
  label: string;
  value: string;
}

function createStat(icon: string, modifier: string, label: string, value: Node): HTMLElement {
  return createElement('p', {
    className: `game-info__stat game-info__stat--${modifier}`,
    children: [
      createIcon(icon, 'game-info__stat-icon'),
      createElement('span', { className: 'visually-hidden', text: label }),
      value,
    ],
  });
}

function createSpecs(game: GameDetails): HTMLDListElement {
  const specs: readonly Spec[] = [
    { label: 'Genre', value: game.specs.genre },
    { label: 'Players', value: game.specs.players },
    { label: 'Duration', value: game.specs.duration },
    { label: 'Price', value: game.specs.price },
  ];

  return createElement('dl', {
    className: 'game-info__specs',
    children: specs.map((spec: Spec): HTMLElement =>
      createElement('div', {
        className: 'game-info__spec',
        children: [
          createElement('dt', { text: spec.label }),
          createElement('dd', { text: spec.value }),
        ],
      }),
    ),
  });
}

/**
 * Title, rating, likes, description, characteristics and the actions of the game. "Play Now" does
 * nothing yet; the free static game never shows the paid "Buy Now" variant.
 */
export function createGameInfo(
  game: GameDetails,
  titleId: string,
  requireSession: RequireSession,
): HTMLElement {
  const title: HTMLHeadingElement = createElement('h2', {
    className: 'game-info__title',
    text: game.name,
    attributes: { id: titleId },
  });
  const rating: Text = document.createTextNode(formatRating(game.rating));
  const likes: Text = document.createTextNode(formatCount(game.likesCount));
  const stats: HTMLElement = createElement('div', {
    className: 'game-info__stats',
    children: [
      createStat(starIcon, 'rating', 'Rating', rating),
      createStat(heartIcon, 'likes', 'Likes', likes),
    ],
  });
  const favoriteButton: HTMLButtonElement = createFavoriteButton({
    slug: game.slug,
    isFavorited: game.isLikedByCurrentUser,
    requireSession,
    onLikesCount: (likesCount: number): void => {
      likes.textContent = formatCount(likesCount);
    },
  });
  const description: HTMLParagraphElement = createElement('p', {
    className: 'game-info__description',
    text: game.fullDescription,
  });
  const playButton: HTMLButtonElement = createElement('button', {
    className: 'game-info__play',
    text: 'Play Now',
    attributes: { type: 'button' },
  });

  return createElement('section', {
    className: 'game-info',
    attributes: { 'aria-labelledby': titleId },
    children: [
      createElement('div', { className: 'game-info__heading', children: [title, stats] }),
      description,
      createSpecs(game),
      createElement('div', {
        className: 'game-info__actions',
        children: [playButton, favoriteButton],
      }),
    ],
  });
}
