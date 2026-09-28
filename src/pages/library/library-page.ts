import './library-page.scss';

import {
  ApiError,
  createLatestRequest,
  getErrorMessage,
  isAbortError,
  type LatestRequest,
} from '@/api/client';
import {
  type ApiResponse,
  fetchCategories,
  fetchGames,
  type GamesMeta,
  type SortValue,
} from '@/api/games';
import { navigate, onLocationChange } from '@/app/navigation';
import { createFilterChips, type FilterChips } from '@/components/filter-chips/filter-chips';
import { createLibraryCard } from '@/components/library-card/library-card';
import { createPagination, type Pagination } from '@/components/pagination/pagination';
import { createSortDropdown, type SortDropdown } from '@/components/sort-dropdown/sort-dropdown';
import { createButton } from '@/components/ui/button/button';
import { createEmptyState } from '@/components/ui/empty-state/empty-state';
import { createErrorBanner } from '@/components/ui/error-banner/error-banner';
import { createSkeleton, createSkeletonRegion } from '@/components/ui/skeleton/skeleton';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { DEFAULT_SORT_VALUE, LIBRARY_PAGE_SIZE, SORT_OPTIONS } from '@/shared/constants/library';
import { LIBRARY_PATH } from '@/shared/constants/links';
import { createElement } from '@/shared/dom/create-element';
import type { Game, GameCategory } from '@/shared/types/game';

import {
  buildLibraryUrl,
  hasInvalidLibraryQuery,
  isSameLibraryState,
  type LibraryState,
  readLibraryState,
} from './library-state';

const TITLE_ID: string = 'library-title';
// Used until the categories arrive, and when they can not be loaded.
const FALLBACK_CATEGORY: string = 'all';
const SKELETON_CHIPS: number = 5;

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

function createSkeletonChips(): HTMLElement {
  return createSkeletonRegion(
    'Loading categories',
    Array.from({ length: SKELETON_CHIPS }, (): HTMLElement =>
      createSkeleton('library__skeleton-chip'),
    ),
    'library__skeleton-chips',
  );
}

function createSkeletonCards(): HTMLElement {
  return createSkeletonRegion(
    'Loading games',
    Array.from({ length: LIBRARY_PAGE_SIZE }, (): HTMLElement =>
      createSkeleton('library__skeleton-card'),
    ),
    'library__list',
  );
}

// The way out of an empty result: the Library with its default filter, sort and page.
function createResetButton(): HTMLButtonElement {
  const button: HTMLButtonElement = createButton({
    label: 'Show All Games',
    variant: 'primary',
    size: 'small',
  });

  button.addEventListener('click', (): void => {
    navigate(LIBRARY_PATH);
  });

  return button;
}

export interface LibraryPageOptions {
  /**
   * Called by the Details button of a game card.
   */
  onGameDetails: (game: Game) => void;
}

/**
 * Library page. Its filter, sort and page live in the URL: the controls only navigate, and every
 * URL change (a click, Back / Forward, a pasted link) restores the controls and requests the
 * matching games from the API.
 */
export function createLibraryPage(options: LibraryPageOptions): HTMLElement {
  let state: LibraryState = readLibraryState();
  let categories: readonly GameCategory[] = [];
  let defaultCategory: string = FALLBACK_CATEGORY;
  let chips: FilterChips | undefined;
  let knownTotalPages: number = 1;

  const go = (next: LibraryState): void => {
    navigate(buildLibraryUrl(next));
  };

  const chipsSlot: HTMLElement = createElement('div', { className: 'library__chips' });
  const sort: SortDropdown = createSortDropdown(
    SORT_OPTIONS,
    state.sort,
    (value: SortValue): void => {
      go({ category: state.category, sort: value, page: 1 });
    },
  );
  const toolbar: HTMLElement = createElement('div', {
    className: 'library__toolbar',
    children: [chipsSlot, sort.element],
  });
  const content: HTMLElement = createElement('div', { className: 'library__content' });
  const games: HTMLElement = createElement('section', {
    className: 'library__games',
    attributes: { 'aria-label': 'Games' },
    children: [content],
  });
  const pagination: Pagination = createPagination((page: number): void => {
    go({ ...state, page });
  });
  const paginationSection: HTMLElement = createElement('div', {
    className: 'library__pagination',
    children: [pagination.element],
  });
  const element: HTMLElement = createElement('main', {
    className: 'page library',
    attributes: { id: 'main-content', 'aria-labelledby': TITLE_ID },
    children: [createIntro(), toolbar, games, paginationSection],
  });

  const getActiveCategory = (): string => state.category ?? defaultCategory;

  const getCategoryLabel = (slug: string): string =>
    categories.find((category: GameCategory): boolean => category.slug === slug)?.label ?? slug;

  const isFiltered = (): boolean =>
    getActiveCategory() !== defaultCategory || state.sort !== DEFAULT_SORT_VALUE;

  // -------------------------------------------------------------------- Categories
  const categoriesRequest: LatestRequest = createLatestRequest();

  const loadCategories = async (): Promise<void> => {
    chipsSlot.replaceChildren(createSkeletonChips());

    try {
      categories = await fetchCategories({ signal: categoriesRequest.next() });
      defaultCategory =
        categories.find((category: GameCategory): boolean => category.isDefault)?.slug ??
        FALLBACK_CATEGORY;
      chips = createFilterChips(categories, getActiveCategory(), (slug: string): void => {
        go({ category: slug, sort: state.sort, page: 1 });
      });
      chipsSlot.replaceChildren(chips.element);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }

      chipsSlot.replaceChildren(
        createErrorBanner({
          title: 'Categories could not be loaded',
          message: getErrorMessage(error),
          onRetry: (): void => {
            void loadCategories();
          },
        }),
      );
      showSnackbar({ message: 'Failed to load the game categories.', variant: 'error' });
    }
  };

  // The card badges show the category labels, so the list waits for the first categories answer.
  const categoriesReady: Promise<void> = loadCategories();

  // ------------------------------------------------------------------------- Games
  const gamesRequest: LatestRequest = createLatestRequest();

  const showNotFound = (): void => {
    content.replaceChildren(
      createEmptyState({
        title: 'Data Not Found',
        message: 'No games match the selected filters on this page.',
        ...((isFiltered() || state.page > 1) && { action: createResetButton() }),
      }),
    );
  };

  const renderGames = (list: readonly Game[]): void => {
    const items: HTMLLIElement[] = list.map((game: Game): HTMLLIElement =>
      createElement('li', {
        children: [
          createLibraryCard({
            game,
            categoryLabel: getCategoryLabel(game.category),
            onDetails: (): void => {
              options.onGameDetails(game);
            },
          }),
        ],
      }),
    );

    content.replaceChildren(createElement('ul', { className: 'library__list', children: items }));
  };

  const loadGames = async (): Promise<void> => {
    const signal: AbortSignal = gamesRequest.next();

    content.replaceChildren(createSkeletonCards());
    // The requested page is shown right away; the real range comes with the response.
    pagination.update(state.page, Math.max(knownTotalPages, state.page));

    try {
      const [response]: [ApiResponse<Game[], GamesMeta>, unknown] = await Promise.all([
        fetchGames(
          {
            ...(state.category !== undefined && { category: state.category }),
            sort: state.sort,
            page: state.page,
            limit: LIBRARY_PAGE_SIZE,
          },
          { signal },
        ),
        categoriesReady,
      ]);

      knownTotalPages = response.meta.totalPages;
      pagination.update(response.meta.page, response.meta.totalPages);

      if (response.data.length === 0) {
        showNotFound();
      } else {
        renderGames(response.data);
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }

      // An unknown category in a typed or outdated link.
      if (error instanceof ApiError && error.status === 400) {
        knownTotalPages = 1;
        pagination.update(1, 1);
        showNotFound();
        return;
      }

      content.replaceChildren(
        createErrorBanner({
          title: 'Games could not be loaded',
          message: getErrorMessage(error),
          onRetry: (): void => {
            void loadGames();
          },
        }),
      );
      showSnackbar({ message: 'Failed to load the games.', variant: 'error' });
    }
  };

  // ------------------------------------------------------------------- URL state
  // A broken sort or page in the address is replaced by its default, without a history entry.
  const fixUrl = (): void => {
    if (hasInvalidLibraryQuery()) {
      history.replaceState(history.state, '', buildLibraryUrl(state, location.search));
    }
  };

  const stopListening: () => void = onLocationChange((): void => {
    // The Library page is rebuilt on every visit, so a detached page stops listening.
    if (!element.isConnected) {
      stopListening();
      categoriesRequest.abort();
      gamesRequest.abort();
      return;
    }

    const next: LibraryState = readLibraryState();

    fixUrl();

    // Opening or closing a dialog changes the URL but not the list.
    if (isSameLibraryState(next, state)) {
      return;
    }

    state = next;
    chips?.setValue(getActiveCategory());
    sort.setValue(state.sort);
    void loadGames();
  });

  fixUrl();
  void loadGames();

  return element;
}
