import type { SortValue } from '@/api/games';

export interface SortOption {
  value: SortValue;
  label: string;
}

// Sort methods of the Library toolbar (from the guidebook); the API sorts the list.
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-asc', label: 'Rating ↑' },
  { value: 'rating-desc', label: 'Rating ↓' },
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'name-desc', label: 'Name Z→A' },
];

export const DEFAULT_SORT_VALUE: SortValue = 'rating-desc';

// Cards per Library page (the mockup shows one page of six cards).
export const LIBRARY_PAGE_SIZE: number = 6;
