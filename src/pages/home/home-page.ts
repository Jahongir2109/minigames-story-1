import { createCarousel } from '@/components/carousel/carousel';
import { createHero } from '@/components/hero/hero';
import { createElement } from '@/shared/dom/create-element';

export function createHomePage(): HTMLElement {
  return createElement('main', {
    className: 'page',
    attributes: { id: 'main-content' },
    children: [createHero(), createCarousel()],
  });
}
