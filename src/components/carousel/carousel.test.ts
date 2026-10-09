import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Game } from '@/shared/types/game';
import { type ApiStub, json, stubApi } from '@/test-utils/api';

import { createCarousel } from './carousel';

function createGame(slug: string): Game {
  return {
    slug,
    name: slug.toUpperCase(),
    category: 'puzzle',
    price: 'Free',
    shortDescription: '',
    rating: 4,
    likesCount: 10,
    cardImage: `/${slug}.png`,
  };
}

const GAMES: Game[] = ['a', 'b', 'c', 'd'].map((slug: string): Game => createGame(slug));

// happy-dom never measures elements, so the stand-in reports a size as soon as it observes one,
// like a browser does for an attached element.
class InstantResizeObserver {
  readonly #callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
  }

  observe(): void {
    this.#callback([], this as unknown as ResizeObserver);
  }

  disconnect(): void {
    // Nothing to release.
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', InstantResizeObserver);
  // The tablet track width, so a swipe has a real card step.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(752);
});

interface Setup {
  section: HTMLElement;
  onGameDetails: Mock<(game: Game) => void>;
}

async function setup(games: Game[] = GAMES): Promise<Setup> {
  stubApi((): Response => json({ data: games, meta: {} }));

  const onGameDetails: Mock<(game: Game) => void> = vi.fn();
  const section: HTMLElement = createCarousel({ onGameDetails });

  document.body.append(section);
  await vi.waitFor(() => {
    expect(section.querySelector('[aria-busy="true"]')).toBeNull();
  });

  return { section, onGameDetails };
}

function items(section: HTMLElement): HTMLLIElement[] {
  return [...section.querySelectorAll<HTMLLIElement>('.carousel__item')];
}

function transforms(section: HTMLElement): string[] {
  return items(section).map((item: HTMLLIElement): string => item.style.transform);
}

function track(section: HTMLElement): HTMLElement {
  const element: HTMLElement | null = section.querySelector('.carousel__track');

  if (element === null) {
    throw new Error('No track');
  }

  return element;
}

function pointer(type: string, clientX: number): PointerEvent {
  return new PointerEvent(type, { pointerId: 1, pointerType: 'touch', clientX, bubbles: true });
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('createCarousel', () => {
  it('shows the featured games in a loop with arrows', async () => {
    const api: ApiStub = stubApi((): Response => json({ data: GAMES, meta: {} }));
    const section: HTMLElement = createCarousel({ onGameDetails: vi.fn() });

    document.body.append(section);
    expect(section.querySelector('[aria-busy="true"]')).not.toBeNull();

    await vi.waitFor(() => {
      expect(items(section)).toHaveLength(4);
    });
    expect(api.requests()[0]?.query).toEqual({ featured: 'true' });
    expect(section.querySelectorAll('.carousel__control')).toHaveLength(2);
    expect(items(section)[0]?.getAttribute('aria-label')).toBe('1 of 4');
  });

  it('moves the next card into the middle and back', async () => {
    const { section } = await setup();
    const start: string[] = transforms(section);

    section.querySelector<HTMLButtonElement>('.carousel__control--next')?.click();
    expect(transforms(section)[1]).toBe(start[0]);

    section.querySelector<HTMLButtonElement>('.carousel__control--previous')?.click();
    expect(transforms(section)).toEqual(start);
  });

  it('plays one card every 4 seconds', async () => {
    const { section } = await setup();
    const start: string[] = transforms(section);

    vi.useFakeTimers();
    // A click restarts the countdown with the fake clock.
    section.querySelector<HTMLButtonElement>('.carousel__control--previous')?.click();
    vi.advanceTimersByTime(4000);

    expect(transforms(section)).toEqual(start);
  });

  it('stops playing once the section is removed', async () => {
    const { section } = await setup();

    vi.useFakeTimers();
    section.querySelector<HTMLButtonElement>('.carousel__control--next')?.click();
    const moved: string[] = transforms(section);

    section.remove();
    vi.advanceTimersByTime(8000);

    expect(transforms(section)).toEqual(moved);
  });

  it('moves one card for a swipe and ignores the click after it', async () => {
    const { section, onGameDetails } = await setup();
    const start: string[] = transforms(section);
    const element: HTMLElement = track(section);

    element.setPointerCapture = vi.fn();
    element.dispatchEvent(pointer('pointerdown', 200));
    element.dispatchEvent(pointer('pointermove', 150));
    element.dispatchEvent(pointer('pointerup', 150));
    section.querySelector<HTMLButtonElement>('.game-card__open')?.click();

    expect(transforms(section)[1]).toBe(start[0]);
    expect(onGameDetails).not.toHaveBeenCalled();
  });

  it('keeps the position and opens the card for a tap', async () => {
    const { section, onGameDetails } = await setup();
    const start: string[] = transforms(section);
    const element: HTMLElement = track(section);

    element.dispatchEvent(pointer('pointerdown', 200));
    element.dispatchEvent(pointer('pointermove', 202));
    element.dispatchEvent(pointer('pointerup', 202));
    section.querySelector<HTMLButtonElement>('.game-card__open')?.click();

    expect(transforms(section)).toEqual(start);
    expect(onGameDetails).toHaveBeenCalledWith(GAMES[0]);
  });

  it('ignores a second pointer and a right mouse button', async () => {
    const { section } = await setup();
    const start: string[] = transforms(section);
    const element: HTMLElement = track(section);

    element.dispatchEvent(
      new PointerEvent('pointerdown', { pointerId: 2, pointerType: 'mouse', button: 2 }),
    );
    element.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 900 }));
    element.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, clientX: 900 }));

    expect(transforms(section)).toEqual(start);
  });

  it('shows a placeholder without featured games', async () => {
    const { section } = await setup([]);

    expect(section.textContent).toContain('No new games yet');
    expect(section.querySelector('.carousel__control')).toBeNull();
  });

  it('shows an error banner that loads the games again', async () => {
    let isFailing: boolean = true;

    stubApi((): Response =>
      isFailing ? json({ error: 'Server error' }, 500) : json({ data: GAMES, meta: {} }),
    );
    const section: HTMLElement = createCarousel({ onGameDetails: vi.fn() });

    document.body.append(section);
    await vi.waitFor(() => {
      expect(section.textContent).toContain('New games could not be loaded');
    });

    isFailing = false;
    section.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();

    await vi.waitFor(() => {
      expect(items(section)).toHaveLength(4);
    });
  });
});
