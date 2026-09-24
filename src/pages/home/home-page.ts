import { createCarousel } from '@/components/carousel/carousel';
import { createLeaderboard } from '@/components/leaderboard/leaderboard';
import { createGameDeveloper } from '@/components/game-developer/game-developer';
import { createHero } from '@/components/hero/hero';
import { createElement } from '@/shared/dom/create-element';
import type { Game } from '@/shared/types/game';

export interface HomePageOptions {
  /**
   * Called when a slider card is clicked.
   */
  onGameDetails: (game: Game) => void;
}

export function createHomePage(options: HomePageOptions): HTMLElement {
  return createElement('main', {
    className: 'page',
    attributes: { id: 'main-content' },
    children: [
      createHero(),
      createCarousel({ onGameDetails: options.onGameDetails }),
      createLeaderboard(),
      createGameDeveloper(),
    ],
  });
}
