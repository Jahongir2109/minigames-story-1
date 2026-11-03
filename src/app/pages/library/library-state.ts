import type { ParamMap, Params } from '@angular/router';

import type { SortValue } from '@/core/api/models';

export const DEFAULT_SORT: SortValue = 'rating-desc';
// Cards per Library page (the mockup shows one page of six cards).
export const LIBRARY_PAGE_SIZE: number = 6;

export interface SortOption {
  value: SortValue;
  /**
   * Translation key of the label.
   */
  label: string;
}

// Sort methods of the Library toolbar (from the guidebook); the API sorts the list.
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-asc', label: 'library.sort.ratingAsc' },
  { value: 'rating-desc', label: 'library.sort.ratingDesc' },
  { value: 'name-asc', label: 'library.sort.nameAsc' },
  { value: 'name-desc', label: 'library.sort.nameDesc' },
];

const CATEGORY_KEY: string = 'category';
const SORT_KEY: string = 'sort';
const PAGE_KEY: string = 'page';

/**
 * The Library controls as they are written in the URL, e.g.
 * `/library?category=puzzle&sort=rating-desc&page=2`. The URL is the only source of this state:
 * the controls write it, and the page reads it back to show the controls and request the games.
 */
export interface LibraryState {
  /**
   * `undefined` until a category is chosen: the default chip of the API is active then.
   */
  category: string | undefined;
  sort: SortValue;
  page: number;
}

function isSortValue(value: string | null): value is SortValue {
  return SORT_OPTIONS.some((option: SortOption) => option.value === value);
}

function parsePage(value: string | null): number | undefined {
  return value !== null && /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

export function readLibraryState(query: ParamMap): LibraryState {
  const category: string | null = query.get(CATEGORY_KEY);
  const sort: string | null = query.get(SORT_KEY);

  return {
    category: category === null || category === '' ? undefined : category,
    sort: isSortValue(sort) ? sort : DEFAULT_SORT,
    page: parsePage(query.get(PAGE_KEY)) ?? 1,
  };
}

/**
 * `true` when the sort or page of the URL is not a valid value and was replaced by the default.
 */
export function hasInvalidLibraryQuery(query: ParamMap): boolean {
  const sort: string | null = query.get(SORT_KEY);
  const page: string | null = query.get(PAGE_KEY);

  return (sort !== null && !isSortValue(sort)) || (page !== null && parsePage(page) === undefined);
}

export function isSameLibraryState(first: LibraryState, second: LibraryState): boolean {
  return (
    first.category === second.category && first.sort === second.sort && first.page === second.page
  );
}

/**
 * The query of `state`; `null` removes a parameter when it is merged into the URL.
 */
export function toLibraryQuery(state: LibraryState): Params {
  return {
    [CATEGORY_KEY]: state.category ?? null,
    [SORT_KEY]: state.sort,
    [PAGE_KEY]: state.page,
  };
}
