import './section-title.scss';

import { createElement } from '@/shared/dom/create-element';

export function createSectionTitle(text: string, id: string): HTMLElement {
  const accent: HTMLSpanElement = createElement('span', {
    className: 'section-title__accent',
    attributes: { 'aria-hidden': 'true' },
  });
  const heading: HTMLHeadingElement = createElement('h2', {
    className: 'section-title__text',
    text,
    attributes: { id },
  });

  return createElement('div', { className: 'section-title', children: [accent, heading] });
}
