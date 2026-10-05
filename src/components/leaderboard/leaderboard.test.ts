import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LeaderboardEntry } from '@/shared/types/game';
import { json, stubApi } from '@/test-utils/api';

import { createLeaderboard } from './leaderboard';

function createEntry(rank: number, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank,
    playerName: `Player ${String(rank)}`,
    gamesPlayed: 10 * rank,
    totalScore: 1_234_567,
    streakDays: rank,
    favoriteGameSlug: 'tukoni',
    favoriteGameName: 'Tukoni',
    ...overrides,
  };
}

function mount(): HTMLElement {
  const section: HTMLElement = createLeaderboard();

  document.body.append(section);

  return section;
}

function rows(section: HTMLElement): HTMLTableRowElement[] {
  return [...(section.querySelector('tbody')?.querySelectorAll('tr') ?? [])];
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createLeaderboard', () => {
  it('shows the players from the API ranked as they come', async () => {
    stubApi((): Response =>
      json({
        data: [
          createEntry(1, { playerName: 'Cozy Gamer' }),
          ...[2, 3, 4, 5, 6].map((rank: number): LeaderboardEntry => createEntry(rank)),
        ],
      }),
    );
    const section: HTMLElement = mount();

    expect(section.querySelector('[aria-busy="true"]')).not.toBeNull();
    await vi.waitFor(() => {
      expect(rows(section)).toHaveLength(6);
    });

    const first: HTMLTableRowElement | undefined = rows(section)[0];

    expect(first?.querySelector('.leaderboard__rank--first')?.textContent).toBe('#1');
    expect(first?.querySelector('.leaderboard__avatar')?.textContent).toBe('CG');
    expect(first?.querySelector('.leaderboard__avatar')?.getAttribute('style')).toContain(
      'var(--color-primary)',
    );
    // The full score for desktop and the compact one for smaller layouts.
    expect(first?.querySelector('.leaderboard__cell--score')?.textContent).toBe('1,234,5671234.5K');
    expect(first?.querySelector('.leaderboard__streak')?.textContent).toContain('1 days');
    // Rows from the fourth one are extra rows that the compact layouts hide.
    expect(rows(section)[3]?.classList.contains('leaderboard__row--extra')).toBe(true);
    // Ranks without a design color fall back to the first random token.
    expect(
      rows(section)[5]?.querySelector('.leaderboard__avatar')?.getAttribute('style'),
    ).toContain('avatar-random-1');
  });

  it('shortens the heading for mobile with a suffix', () => {
    stubApi((): Response => json({ data: [] }));
    const section: HTMLElement = mount();

    expect(section.querySelector('h2')?.textContent).toBe('Top Players This Week');
    expect(section.querySelector('.leaderboard__title-suffix')?.textContent).toBe(' This Week');
  });

  it('shows an empty state without players', async () => {
    stubApi((): Response => json({ data: [] }));
    const section: HTMLElement = mount();

    await vi.waitFor(() => {
      expect(section.textContent).toContain('No players yet');
    });
  });

  it('shows an error banner that loads the table again', async () => {
    let isFailing: boolean = true;

    stubApi((): Response =>
      isFailing ? json({ error: 'Server error' }, 500) : json({ data: [createEntry(1)] }),
    );
    const section: HTMLElement = mount();

    await vi.waitFor(() => {
      expect(section.textContent).toContain('Top players could not be loaded');
    });

    isFailing = false;
    section.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();

    await vi.waitFor(() => {
      expect(rows(section)).toHaveLength(1);
    });
  });
});
