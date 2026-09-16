import { createHero } from '@/components/hero/hero';
import { createCarousel } from '@/components/carousel/carousel';
import { createLeaderboard } from '@/components/leaderboard/leaderboard';
import { createCta } from '@/components/cta/cta';

export function createHomePage(): HTMLElement {
  const main = document.createElement('main');
  main.className = 'home';
  main.append(createHero(), createCarousel(), createLeaderboard(), createCta());
  return main;
}
