export interface SortOption {
  value: string;
  label: string;
}

// Sort methods of the Library toolbar (from the guidebook). Sorting itself comes with the API.
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-asc', label: 'Rating ↑' },
  { value: 'rating-desc', label: 'Rating ↓' },
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'name-desc', label: 'Name Z→A' },
];

export const DEFAULT_SORT_VALUE: string = 'rating-desc';
