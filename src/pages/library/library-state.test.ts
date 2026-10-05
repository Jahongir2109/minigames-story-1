import { describe, expect, it } from 'vitest';

import {
  buildLibraryUrl,
  hasInvalidLibraryQuery,
  isSameLibraryState,
  type LibraryState,
  readLibraryState,
} from './library-state';

const STATE: LibraryState = { category: 'puzzle', sort: 'name-asc', page: 2 };

describe('readLibraryState', () => {
  it('reads the controls from the URL', () => {
    expect(readLibraryState('?category=puzzle&sort=name-asc&page=2')).toEqual(STATE);
  });

  it('falls back to the defaults for missing or invalid values', () => {
    expect(readLibraryState('')).toEqual({ category: undefined, sort: 'rating-desc', page: 1 });
    expect(readLibraryState('?category=&sort=price&page=0')).toEqual({
      category: undefined,
      sort: 'rating-desc',
      page: 1,
    });
    expect(readLibraryState('?page=2.5').page).toBe(1);
  });

  it('reads the current URL by default', () => {
    history.replaceState(null, '', '/library?sort=name-desc');

    expect(readLibraryState().sort).toBe('name-desc');
  });
});

describe('hasInvalidLibraryQuery', () => {
  it('flags an unknown sort or a broken page', () => {
    expect(hasInvalidLibraryQuery('?sort=price')).toBe(true);
    expect(hasInvalidLibraryQuery('?page=-1')).toBe(true);
    expect(hasInvalidLibraryQuery('?page=abc')).toBe(true);
  });

  it('accepts valid or missing values', () => {
    expect(hasInvalidLibraryQuery('?sort=rating-asc&page=3')).toBe(false);
    expect(hasInvalidLibraryQuery('?category=anything')).toBe(false);
    history.replaceState(null, '', '/library');
    expect(hasInvalidLibraryQuery()).toBe(false);
  });
});

describe('isSameLibraryState', () => {
  it('compares every control', () => {
    expect(isSameLibraryState(STATE, { ...STATE })).toBe(true);
    expect(isSameLibraryState(STATE, { ...STATE, page: 3 })).toBe(false);
    expect(isSameLibraryState(STATE, { ...STATE, sort: 'name-desc' })).toBe(false);
    expect(isSameLibraryState(STATE, { ...STATE, category: undefined })).toBe(false);
  });
});

describe('buildLibraryUrl', () => {
  it('writes the controls in a fixed order', () => {
    expect(buildLibraryUrl(STATE)).toBe('/library?category=puzzle&sort=name-asc&page=2');
    expect(buildLibraryUrl({ ...STATE, category: undefined })).toBe(
      '/library?sort=name-asc&page=2',
    );
  });

  it('keeps the other parameters (open dialogs) when asked', () => {
    expect(buildLibraryUrl(STATE, '?page=9&game=tukoni&category=arcade')).toBe(
      '/library?category=puzzle&sort=name-asc&page=2&game=tukoni',
    );
  });
});
