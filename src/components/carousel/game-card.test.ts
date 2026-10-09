import { describe, expect, it, type Mock, vi } from 'vitest';

import type { Game } from '@/shared/types/game';

import { createGameCard } from './game-card';

const GAME: Game = {
  slug: 'tukoni',
  name: 'Tukoni',
  category: 'puzzle',
  price: 'Free',
  shortDescription: 'Cozy forest puzzles',
  rating: 4.75,
  likesCount: 54_200,
  cardImage: '/tukoni.png',
};

describe('createGameCard', () => {
  it('shows the cover, the name and the formatted metrics', () => {
    const card: HTMLElement = createGameCard({ game: GAME });

    expect(card.querySelector('img')?.getAttribute('alt')).toBe('Tukoni cover');
    expect(card.querySelector('.game-card__title')?.textContent).toBe('Tukoni');
    expect(card.querySelector('.game-card__metric--rating')?.textContent).toBe('4.8');
    expect(card.querySelector('.game-card__metric--likes')?.textContent).toBe('54.2K');
    expect(card.querySelector('button')).toBeNull();
  });

  it('opens the details from a button over the card', () => {
    const onOpen: Mock<() => void> = vi.fn();
    const card: HTMLElement = createGameCard({ game: GAME, onOpen });
    const button: HTMLButtonElement | null = card.querySelector('.game-card__open');

    button?.click();

    expect(button?.getAttribute('aria-label')).toBe('Tukoni: open details');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
