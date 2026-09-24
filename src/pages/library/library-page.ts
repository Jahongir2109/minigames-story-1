import './library-page.scss';

import { createFilterChips } from '@/components/filter-chips/filter-chips';
import { createSortDropdown } from '@/components/sort-dropdown/sort-dropdown';
import { categories } from '@/data/categories';
import { DEFAULT_SORT_VALUE, SORT_OPTIONS } from '@/shared/constants/library';
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

function createToolbar(): HTMLElement {
  return createElement('div', {
    className: 'library__toolbar',
    children: [createFilterChips(categories), createSortDropdown(SORT_OPTIONS, DEFAULT_SORT_VALUE)],
  });
}

export function createLibraryPage(): HTMLElement {
  return createElement('main', {
    className: 'page library',
    attributes: { id: 'main-content', 'aria-labelledby': TITLE_ID },
    children: [createIntro(), createToolbar()],
  });
}
