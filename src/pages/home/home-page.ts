import { createCarousel } from '@/components/carousel/carousel';
import { createLeaderboard } from '@/components/leaderboard/leaderboard';
import { createHero } from '@/components/hero/hero';
import { createElement } from '@/shared/dom/create-element';

export function createHomePage(): HTMLElement {
  return createElement('main', {
    className: 'page',
    attributes: { id: 'main-content' },
    children: [createHero(), createCarousel(), createLeaderboard()],
  });
}
