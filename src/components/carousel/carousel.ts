import './carousel.scss';

import arrowBackIcon from '@/assets/icons/arrow-back.svg?raw';
import arrowForwardIcon from '@/assets/icons/arrow-forward.svg?raw';
import { createSectionTitle } from '@/components/section-title/section-title';
import { featuredGames } from '@/data/games';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import type { Game } from '@/shared/types/game';

import { createGameCard } from './game-card';

const TITLE_ID: string = 'new-games-title';

// Cards are shown around the active one: two before and two after it (the outer ones are
// only visible on wide screens).
const VISIBLE_OFFSETS: readonly number[] = [-2, -1, 0, 1, 2];
const INITIAL_ACTIVE_INDEX: number = 0;

function getGameAt(index: number): Game {
  const count: number = featuredGames.length;
  const game: Game | undefined = featuredGames[((index % count) + count) % count];

  if (game === undefined) {
    throw new RangeError('The carousel needs at least one featured game.');
  }

  return game;
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

function createTrack(): HTMLUListElement {
  const track: HTMLUListElement = createElement('ul', {
    className: 'carousel__track',
    attributes: { 'aria-label': 'New games' },
  });

  for (const offset of VISIBLE_OFFSETS) {
    const game: Game = getGameAt(INITIAL_ACTIVE_INDEX + offset);
    const item: HTMLLIElement = createElement('li', {
      className: `carousel__item carousel__item--${offset === 0 ? 'active' : Math.abs(offset) === 1 ? 'near' : 'far'}`,
      children: [createGameCard({ game, active: offset === 0 })],
    });

    track.append(item);
  }

  return track;
}

export function createCarousel(): HTMLElement {
  const controls: HTMLElement = createElement('div', {
    className: 'carousel__controls',
    children: [
      createControl('Previous games', arrowBackIcon, 'previous'),
      createControl('Next games', arrowForwardIcon, 'next'),
    ],
  });
  const header: HTMLElement = createElement('div', {
    className: 'carousel__header',
    children: [createSectionTitle('New Games', TITLE_ID), controls],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'carousel__inner',
    children: [header, createTrack()],
  });

  return createElement('section', {
    className: 'carousel',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
