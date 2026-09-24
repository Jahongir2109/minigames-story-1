import './library-page.scss';

import { createElement } from '@/shared/dom/create-element';

const TITLE_ID: string = 'library-title';

function createIntro(): HTMLElement {
  const title: HTMLHeadingElement = createElement('h1', {
    className: 'library__title',
    text: 'Game Library',
    attributes: { id: TITLE_ID },
  });
  const subtitle: HTMLParagraphElement = createElement('p', {
    className: 'library__subtitle',
    text: 'Browse our collection of casual mini-games',
  });

  return createElement('header', { className: 'library__intro', children: [title, subtitle] });
}

export function createLibraryPage(): HTMLElement {
  return createElement('main', {
    className: 'page library',
    attributes: { id: 'main-content', 'aria-labelledby': TITLE_ID },
    children: [createIntro()],
  });
}
