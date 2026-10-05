import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { navigate } from '@/app/navigation';
import type { Game, GameCategory } from '@/shared/types/game';
import { type ApiRequest, type ApiStub, json, stubApi } from '@/test-utils/api';

import { createLibraryPage } from './library-page';

const CATEGORIES: GameCategory[] = [
  { slug: 'all', label: 'All', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
];

function createGame(slug: string, overrides: Partial<Game> = {}): Game {
  return {
    slug,
    name: slug.toUpperCase(),
    category: 'puzzle',
    price: 'Free',
    shortDescription: `About ${slug}`,
    rating: 4.5,
    likesCount: 1200,
    cardImage: `/${slug}.png`,
    ...overrides,
  };
}

interface Answers {
  categories?: () => Response;
  games?: (request: ApiRequest) => Response;
}

function gamesResponse(games: Game[], page: number = 1, totalPages: number = 3): Response {
  return json({ data: games, meta: { page, limit: 6, totalItems: 18, totalPages } });
}

function stubLibrary(answers: Answers = {}): ApiStub {
  return stubApi((request: ApiRequest): Response => {
    return request.path === '/categories'
      ? (answers.categories?.() ?? json({ data: CATEGORIES }))
      : (answers.games?.(request) ?? gamesResponse([createGame('a'), createGame('b')]));
  });
}

interface Setup {
  page: HTMLElement;
  onGameDetails: Mock<(game: Game) => void>;
}

async function setup(url: string = '/library'): Promise<Setup> {
  history.replaceState(null, '', url);

  const onGameDetails: Mock<(game: Game) => void> = vi.fn();
  const page: HTMLElement = createLibraryPage({ onGameDetails });

  document.body.append(page);
  await settle(page);

  return { page, onGameDetails };
}

// Waits until nothing in the page is loading any more.
async function settle(page: HTMLElement): Promise<void> {
  await vi.waitFor(() => {
    expect(page.querySelector('[aria-busy="true"]')).toBeNull();
  });
}

function gamesRequests(api: ApiStub): ApiRequest[] {
  return api.requests().filter((request: ApiRequest): boolean => request.path === '/games');
}

function cardTitles(page: HTMLElement): string[] {
  return [...page.querySelectorAll('.library-card__title')].map(
    (title: Element): string => title.textContent,
  );
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createLibraryPage', () => {
  it('requests the games of the URL and shows them with category labels', async () => {
    const api: ApiStub = stubLibrary();
    const { page } = await setup('/library?category=puzzle&sort=name-asc&page=2');

    expect(gamesRequests(api)[0]?.query).toEqual({
      category: 'puzzle',
      sort: 'name-asc',
      page: '2',
      limit: '6',
    });
    expect(cardTitles(page)).toEqual(['A', 'B']);
    expect(page.querySelector('.library-card__badge')?.textContent).toBe('Puzzle');
    expect(page.querySelector('[data-category="puzzle"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('activates the default chip and omits the category without one', async () => {
    const api: ApiStub = stubLibrary();
    const { page } = await setup();

    expect(gamesRequests(api)[0]?.query).toEqual({ sort: 'rating-desc', page: '1', limit: '6' });
    expect(page.querySelector('[data-category="all"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('writes a chosen category, sort and page into the URL and loads them', async () => {
    const api: ApiStub = stubLibrary();
    const { page } = await setup();

    page.querySelector<HTMLButtonElement>('[data-category="puzzle"]')?.click();
    expect(location.search).toBe('?category=puzzle&sort=rating-desc&page=1');
    await settle(page);

    page.querySelector<HTMLButtonElement>('.sort-dropdown__toggle')?.click();
    page.querySelector<HTMLElement>('[data-value="name-desc"]')?.click();
    expect(location.search).toBe('?category=puzzle&sort=name-desc&page=1');
    await settle(page);

    page.querySelector<HTMLButtonElement>('[aria-label="Page 2"]')?.click();
    expect(location.search).toBe('?category=puzzle&sort=name-desc&page=2');
    await settle(page);

    expect(gamesRequests(api).at(-1)?.query).toEqual({
      category: 'puzzle',
      sort: 'name-desc',
      page: '2',
      limit: '6',
    });
  });

  it('does not reload the games when only a dialog opens', async () => {
    const api: ApiStub = stubLibrary();
    await setup();

    navigate('/library?game=a');

    expect(gamesRequests(api)).toHaveLength(1);
  });

  it('replaces a broken sort or page in the URL without a new entry', async () => {
    stubLibrary();
    const length: number = history.length;

    await setup('/library?sort=price&page=zero&game=a');

    expect(location.search).toBe('?sort=rating-desc&page=1&game=a');
    expect(history.length).toBe(length);
  });

  it('opens the details of a card', async () => {
    stubLibrary();
    const { page, onGameDetails } = await setup();

    page.querySelector<HTMLButtonElement>('.library-card__details')?.click();

    expect(onGameDetails).toHaveBeenCalledWith(expect.objectContaining({ slug: 'a' }));
  });

  it('offers a reset for an empty filtered result', async () => {
    stubLibrary({ games: (): Response => gamesResponse([], 1, 0) });
    const { page } = await setup('/library?category=puzzle');

    expect(page.textContent).toContain('Data Not Found');

    page.querySelector('.empty-state')?.querySelector<HTMLButtonElement>('.button')?.click();

    expect(location.search).toBe('');
  });

  it('shows no reset for an empty default list', async () => {
    stubLibrary({ games: (): Response => gamesResponse([], 1, 0) });
    const { page } = await setup();

    expect(page.textContent).toContain('Data Not Found');
    expect(page.querySelector('.empty-state')?.querySelector('.button')).toBeNull();
  });

  it('treats an unknown category as an empty result', async () => {
    stubLibrary({ games: (): Response => json({ error: 'Unknown category' }, 400) });
    const { page } = await setup('/library?category=nope');

    expect(page.textContent).toContain('Data Not Found');
    expect(page.querySelectorAll('.pagination__page')).toHaveLength(1);
  });

  it('shows an error banner for the games that loads them again', async () => {
    let isFailing: boolean = true;

    stubLibrary({
      games: (): Response =>
        isFailing ? json({ error: 'Server error' }, 500) : gamesResponse([createGame('a')]),
    });
    const { page } = await setup();

    expect(page.textContent).toContain('Games could not be loaded');

    isFailing = false;
    page
      .querySelector('.library__games')
      ?.querySelector<HTMLButtonElement>('.error-banner__retry')
      ?.click();
    await settle(page);

    expect(cardTitles(page)).toEqual(['A']);
  });

  it('shows an error banner for the categories that loads them again', async () => {
    let isFailing: boolean = true;

    stubLibrary({
      categories: (): Response =>
        isFailing ? json({ error: 'Server error' }, 500) : json({ data: CATEGORIES }),
    });
    const { page } = await setup();

    expect(page.textContent).toContain('Categories could not be loaded');
    // The badge falls back to the slug without the categories.
    expect(page.querySelector('.library-card__badge')?.textContent).toBe('puzzle');

    isFailing = false;
    page
      .querySelector('.library__chips')
      ?.querySelector<HTMLButtonElement>('.error-banner__retry')
      ?.click();
    await settle(page);

    expect(page.querySelectorAll('.filter-chips__chip')).toHaveLength(2);
  });

  it('stops following the URL once the page is left', async () => {
    const api: ApiStub = stubLibrary();
    const { page } = await setup();

    page.remove();
    navigate('/library?page=2');
    navigate('/library?page=3');

    expect(gamesRequests(api)).toHaveLength(1);
  });
});
