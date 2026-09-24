import './library-page.scss';

import { createFilterChips } from '@/components/filter-chips/filter-chips';
import { createLibraryCard } from '@/components/library-card/library-card';
import { createSortDropdown } from '@/components/sort-dropdown/sort-dropdown';
import { categories } from '@/data/categories';
import { games } from '@/data/games';
import { DEFAULT_SORT_VALUE, LIBRARY_PAGE_SIZE, SORT_OPTIONS } from '@/shared/constants/library';
import { createElement } from '@/shared/dom/create-element';
import type { Game, GameCategory } from '@/shared/types/game';

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

function getCategoryLabel(slug: string): string {
  return (
    categories.find((category: GameCategory): boolean => category.slug === slug)?.label ?? slug
  );
}

export interface LibraryPageOptions {
  /**
   * Called by the Details button of a game card.
   */
  onGameDetails?: (game: Game) => void;
}

function createGameList(options: LibraryPageOptions): HTMLElement {
  // Pagination only changes its own state for now, so the first page is always shown.
  const items: HTMLLIElement[] = games
    .slice(0, LIBRARY_PAGE_SIZE)
    .map((game: Game): HTMLLIElement =>
      createElement('li', {
        children: [
          createLibraryCard({
            game,
            categoryLabel: getCategoryLabel(game.category),
            onDetails: (): void => {
              options.onGameDetails?.(game);
            },
          }),
        ],
      }),
    );
  const list: HTMLUListElement = createElement('ul', {
    className: 'library__list',
    children: items,
  });

  return createElement('section', {
    className: 'library__games',
    attributes: { 'aria-label': 'Games' },
    children: [list],
  });
}

export function createLibraryPage(options: LibraryPageOptions = {}): HTMLElement {
  return createElement('main', {
    className: 'page library',
    attributes: { id: 'main-content', 'aria-labelledby': TITLE_ID },
    children: [createIntro(), createToolbar(), createGameList(options)],
  });
}
