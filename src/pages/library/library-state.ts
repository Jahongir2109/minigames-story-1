import type { SortValue } from '@/api/games';
import { DEFAULT_SORT_VALUE, SORT_OPTIONS, type SortOption } from '@/shared/constants/library';
import { LIBRARY_PATH } from '@/shared/constants/links';

const CATEGORY_KEY: string = 'category';
const SORT_KEY: string = 'sort';
const PAGE_KEY: string = 'page';

/**
 * The Library controls as they are written in the URL, e.g.
 * `/library?category=puzzle&sort=rating-desc&page=2`. The URL is the only source of this state:
 * the controls write it, and the page reads it back to render the controls and request the games.
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
  return SORT_OPTIONS.some((option: SortOption): boolean => option.value === value);
}

function parsePage(value: string | null): number | undefined {
  return value !== null && /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

export function readLibraryState(search: string = location.search): LibraryState {
  const parameters: URLSearchParams = new URLSearchParams(search);
  const category: string | null = parameters.get(CATEGORY_KEY);
  const sort: string | null = parameters.get(SORT_KEY);

  return {
    category: category === null || category === '' ? undefined : category,
    sort: isSortValue(sort) ? sort : DEFAULT_SORT_VALUE,
    page: parsePage(parameters.get(PAGE_KEY)) ?? 1,
  };
}

/**
 * `true` when the sort or page of the URL is not a valid value and was replaced by the default.
 */
export function hasInvalidLibraryQuery(search: string = location.search): boolean {
  const parameters: URLSearchParams = new URLSearchParams(search);
  const sort: string | null = parameters.get(SORT_KEY);
  const page: string | null = parameters.get(PAGE_KEY);

  return (sort !== null && !isSortValue(sort)) || (page !== null && parsePage(page) === undefined);
}

export function isSameLibraryState(first: LibraryState, second: LibraryState): boolean {
  return (
    first.category === second.category && first.sort === second.sort && first.page === second.page
  );
}

/**
 * The Library URL of `state`. Other query parameters of the current URL (open dialogs) are kept
 * only when `keep` is set.
 */
export function buildLibraryUrl(state: LibraryState, keep: string = ''): string {
  const parameters: URLSearchParams = new URLSearchParams(keep);

  parameters.delete(CATEGORY_KEY);
  parameters.delete(SORT_KEY);
  parameters.delete(PAGE_KEY);

  const query: URLSearchParams = new URLSearchParams();

  if (state.category !== undefined) {
    query.set(CATEGORY_KEY, state.category);
  }

  query.set(SORT_KEY, state.sort);
  query.set(PAGE_KEY, String(state.page));

  for (const [key, value] of parameters) {
    query.append(key, value);
  }

  return `${LIBRARY_PATH}?${query.toString()}`;
}
