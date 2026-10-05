import { describe, expect, it } from 'vitest';

import type { TopRecord } from '@/shared/types/game';

import { createGameRecords } from './game-records';

function createRecord(position: number): TopRecord {
  return {
    position,
    playerName: `Player ${String(position)}`,
    score: 356_700,
    achievedAt: new Date().toISOString(),
  };
}

describe('createGameRecords', () => {
  it('lists the records with medals for the top three', () => {
    const section: HTMLElement = createGameRecords(
      [1, 2, 3, 4].map((position: number): TopRecord => createRecord(position)),
    );
    const medals: string[] = [...section.querySelectorAll('.game-records__medal')].map(
      (medal: Element): string => medal.textContent,
    );

    expect(medals).toEqual(['🥇', '🥈', '🥉', '4']);
    expect(section.querySelector('.game-records__player')?.textContent).toBe('🥇Place 1:Player 1');
    expect(section.querySelector('.game-records__result')?.querySelector('span')?.textContent).toBe(
      '356,700 pts',
    );
  });

  it('shows an empty state without records', () => {
    const section: HTMLElement = createGameRecords([]);

    expect(section.querySelector('ol')).toBeNull();
    expect(section.textContent).toContain('No records yet');
  });
});
