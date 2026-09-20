import './hero.scss';

import { createButton } from '@/components/ui/button/button';
import { createElement } from '@/shared/dom/create-element';

const HERO_TITLE_ID: string = 'hero-title';

export function createHero(): HTMLElement {
  const title: HTMLHeadingElement = createElement('h1', {
    className: 'hero__title',
    text: 'Take a Short Break & Have Fun',
    attributes: { id: HERO_TITLE_ID },
  });
  // The mobile layout uses a shorter sentence than the tablet and desktop layouts.
  const description: HTMLParagraphElement = createElement('p', {
    className: 'hero__description',
    children: [
      createElement('span', {
        className: 'hero__text-short',
        text: 'Discover hundreds of curated casual mini-games right in your browser.',
      }),
      createElement('span', {
        className: 'hero__text-full',
        text: 'Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.',
      }),
    ],
  });
  const button: HTMLButtonElement = createButton({
    label: 'Browse Library',
    variant: 'primary',
    size: 'adaptive',
    className: 'hero__button',
  });

  const card: HTMLElement = createElement('div', {
    className: 'hero__card',
    children: [title, description, button],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'hero__inner',
    children: [card],
  });

  return createElement('section', {
    className: 'hero',
    attributes: { 'aria-labelledby': HERO_TITLE_ID },
    children: [inner],
  });
}
