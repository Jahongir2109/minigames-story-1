import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, Router, RouterOutlet } from '@angular/router';

import { STORAGE } from '@/core/storage/storage';

import { createGame, expectApi, provideTestApi } from '../../../testing/api';
import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { Library } from './library';
import {
  hasInvalidLibraryQuery,
  type LibraryState,
  readLibraryState,
  toLibraryQuery,
} from './library-state';
import { getVisiblePages } from './pagination/pagination';

@Component({
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Outlet {}

const CATEGORIES: unknown[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'quiz', label: 'Quiz', isDefault: false },
];

function meta(page: number, totalPages: number): object {
  return { page, limit: 6, totalItems: totalPages * 6, totalPages };
}

describe('library state', () => {
  it('reads the controls from the URL and falls back to the defaults', () => {
    expect(readLibraryState(convertToParamMap({ category: 'puzzle', page: '2' }))).toEqual({
      category: 'puzzle',
      sort: 'rating-desc',
      page: 2,
    });
    expect(readLibraryState(convertToParamMap({ sort: 'price', page: '0' }))).toEqual({
      category: undefined,
      sort: 'rating-desc',
      page: 1,
    });
  });

  it('finds the broken values that have to be replaced in the URL', () => {
    expect(hasInvalidLibraryQuery(convertToParamMap({ sort: 'name-asc', page: '3' }))).toBe(false);
    expect(hasInvalidLibraryQuery(convertToParamMap({ sort: 'price' }))).toBe(true);
    expect(hasInvalidLibraryQuery(convertToParamMap({ page: '-1' }))).toBe(true);
  });

  it('writes the state back without an empty category', () => {
    const state: LibraryState = { category: undefined, sort: 'name-desc', page: 1 };

    expect(toLibraryQuery(state)).toEqual({ category: null, sort: 'name-desc', page: 1 });
  });
});

describe('getVisiblePages', () => {
  it('keeps the current page near the middle of the window', () => {
    expect(getVisiblePages(1, 10, 4)).toEqual([1, 2, 3, 4]);
    expect(getVisiblePages(5, 10, 4)).toEqual([4, 5, 6, 7]);
    expect(getVisiblePages(10, 10, 3)).toEqual([8, 9, 10]);
    expect(getVisiblePages(1, 2, 4)).toEqual([1, 2]);
  });
});

async function setup(url: string): Promise<{
  fixture: ComponentFixture<unknown>;
  root: HTMLElement;
  router: Router;
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'library', component: Library }]),
      provideTestApi(),
      provideTestI18n(),
      { provide: STORAGE, useValue: new MemoryStorage() },
    ],
  });

  const router: Router = TestBed.inject(Router);
  const fixture: ComponentFixture<unknown> = TestBed.createComponent(Outlet);

  await router.navigateByUrl(url);
  TestBed.tick();

  return { fixture, root: fixture.nativeElement as HTMLElement, router };
}

function chips(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.filter-chips__chip')].map(
    (chip: Element) => `${chip.textContent.trim()}:${String(chip.getAttribute('aria-pressed'))}`,
  );
}

describe('Library', () => {
  it('requests the games of the URL and marks its controls', async () => {
    const { fixture, root } = await setup('/library?category=puzzle&sort=name-asc&page=2');

    expectApi('/categories').flush({ data: CATEGORIES });
    const request: ReturnType<typeof expectApi> = expectApi('/games');

    expect(request.request.params.toString()).toBe('category=puzzle&sort=name-asc&page=2&limit=6');

    request.flush({ data: [createGame()], meta: meta(2, 3) });
    await fixture.whenStable();

    expect(chips(root)).toEqual(['All Games:false', 'Puzzle:true', 'Quiz:false']);
    expect(root.querySelector('.sort-dropdown__value')?.textContent.trim()).toBe('Name A→Z');
    expect(root.querySelector('.library-card__badge')?.textContent.trim()).toBe('Puzzle');
    expect(root.querySelector('.pagination__page[aria-current="page"]')?.textContent.trim()).toBe(
      '2',
    );
  });

  it('writes a chosen category into the URL and starts at page one', async () => {
    const { fixture, root, router } = await setup('/library?sort=name-asc&page=3&game=tukoni');

    expectApi('/categories').flush({ data: CATEGORIES });
    expectApi('/games').flush({ data: [createGame()], meta: meta(3, 3) });
    await fixture.whenStable();

    root.querySelectorAll<HTMLButtonElement>('.filter-chips__chip')[2]?.click();
    TestBed.tick();
    await vi.waitFor(() => {
      expect(router.url).toBe('/library?category=quiz&sort=name-asc&page=1');
    });

    expectApi('/games').flush({ data: [createGame({ category: 'quiz' })], meta: meta(1, 1) });
    await fixture.whenStable();

    // A category without a translation keeps the label of the API.
    expect(root.querySelector('.library-card__badge')?.textContent.trim()).toBe('Quiz');
  });

  it('treats an unknown category as an empty result with a way back', async () => {
    const { fixture, root, router } = await setup('/library?category=zzz');

    expectApi('/categories').flush({ data: CATEGORIES });
    expectApi('/games').flush(
      { error: 'Invalid category parameter: zzz' },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(root.querySelector('.empty-state__title')?.textContent).toBe('Data Not Found');
    expect(root.querySelector('app-error-banner')).toBeNull();

    root.querySelector<HTMLButtonElement>(':scope app-empty-state button')?.click();
    TestBed.tick();
    await vi.waitFor(() => {
      expect(router.url).toBe('/library');
    });
    expectApi('/games').flush({ data: [], meta: meta(1, 0) });
  });

  it('replaces a broken sort in the URL with the default', async () => {
    const { router } = await setup('/library?sort=price');

    await vi.waitFor(() => {
      expect(router.url).toBe('/library?sort=rating-desc&page=1');
    });

    expectApi('/categories').flush({ data: CATEGORIES });
    expectApi('/games').flush({ data: [], meta: meta(1, 0) });
  });

  it('shows a Retry banner when the games fail', async () => {
    const { fixture, root } = await setup('/library');

    expectApi('/categories').flush({ data: CATEGORIES });
    expectApi('/games').flush({ error: 'Down' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(root.querySelector('.error-banner__title')?.textContent.trim()).toBe(
      'Games could not be loaded',
    );

    root.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();
    TestBed.tick();
    expectApi('/games').flush({ data: [createGame()], meta: meta(1, 1) });
    await fixture.whenStable();

    expect(root.querySelectorAll('app-library-card')).toHaveLength(1);
  });
});
