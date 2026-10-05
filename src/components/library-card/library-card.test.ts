import { describe, expect, it, type Mock, vi } from 'vitest';

import type { Game } from '@/shared/types/game';

import { createLibraryCard } from './library-card';

const GAME: Game = {
  slug: 'tukoni',
  name: 'Tukoni',
  category: 'puzzle',
  price: 'Free',
  shortDescription: 'Cozy forest puzzles',
  rating: 4.75,
  likesCount: 31_200,
  cardImage: '/tukoni.png',
};

describe('createLibraryCard', () => {
  it('shows the game with its category, price and stats', () => {
    const card: HTMLElement = createLibraryCard({
      game: GAME,
      categoryLabel: 'Puzzle',
      onDetails: vi.fn(),
    });

    expect(card.querySelector('.library-card__title')?.textContent).toBe('Tukoni');
    expect(card.querySelector('.library-card__badge')?.textContent).toBe('Puzzle');
    expect(card.querySelector('.library-card__price--free')?.textContent).toBe('Free');
    expect(card.querySelector('.library-card__stat--rating')?.textContent).toBe('Rating4.8');
    expect(card.querySelector('.library-card__stat--likes')?.textContent).toBe('Likes31.2K');
  });

  it('marks only a free game as free and opens the details', () => {
    const onDetails: Mock<() => void> = vi.fn();
    const card: HTMLElement = createLibraryCard({
      game: { ...GAME, price: '$4.99' },
      categoryLabel: 'Puzzle',
      onDetails,
    });

    expect(card.querySelector('.library-card__price--free')).toBeNull();

    card.querySelector<HTMLButtonElement>('.library-card__details')?.click();
    expect(onDetails).toHaveBeenCalledTimes(1);
  });
});
