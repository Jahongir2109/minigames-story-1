import './leaderboard.scss';

import { createSectionTitle } from '@/components/section-title/section-title';
import { leaderboard } from '@/data/leaderboard';
import { createElement } from '@/shared/dom/create-element';
import type { LeaderboardEntry } from '@/shared/types/game';
import { formatCount } from '@/shared/utils/format';
import { getInitials } from '@/shared/utils/player';

const TITLE_ID: string = 'leaderboard-title';
const FIRST_PLACE: number = 1;
const FIRST_EXTRA_ROW_INDEX: number = 3;

// The design colors the avatars by rank (first place uses the primary yellow).
const AVATAR_COLORS: readonly string[] = [
  'primary',
  'avatar-random-2',
  'avatar-random-3',
  'avatar-random-4',
  'avatar-random-5',
];
const FALLBACK_AVATAR_COLOR: string = 'avatar-random-1';

type Column = 'rank' | 'player' | 'games' | 'score' | 'streak' | 'favorite';

/**
 * Header labels per layout: `full` is used on desktop, `short` on tablet and mobile.
 */
interface ColumnDefinition {
  column: Column;
  full: string;
  short: string;
}

const COLUMNS: readonly ColumnDefinition[] = [
  { column: 'rank', full: 'Rank', short: 'Rank' },
  { column: 'player', full: 'Player', short: 'Player' },
  { column: 'games', full: 'Games Played', short: 'Games' },
  { column: 'score', full: 'Total Score', short: 'Score' },
  { column: 'streak', full: 'Streak', short: 'Streak' },
  { column: 'favorite', full: 'Favorite Game', short: 'Favorite Game' },
];

/**
 * Text that is written differently in the compact layouts (tablet / mobile).
 */
function createVariants(full: string, short: string): (HTMLElement | string)[] {
  if (full === short) {
    return [full];
  }

  return [
    createElement('span', { className: 'leaderboard__full', text: full }),
    createElement('span', { className: 'leaderboard__short', text: short }),
  ];
}

function createCell(
  tag: 'th' | 'td',
  column: Column,
  children: readonly (Node | string)[],
): HTMLTableCellElement {
  const cell: HTMLTableCellElement = createElement(tag, {
    className: `leaderboard__cell leaderboard__cell--${column}`,
    children,
  });

  if (tag === 'th') {
    cell.setAttribute('scope', 'col');
  }

  return cell;
}

function createHead(): HTMLTableSectionElement {
  const cells: HTMLTableCellElement[] = COLUMNS.map(
    (definition: ColumnDefinition): HTMLTableCellElement =>
      createCell('th', definition.column, createVariants(definition.full, definition.short)),
  );
  const row: HTMLTableRowElement = createElement('tr', {
    className: 'leaderboard__row',
    children: cells,
  });

  return createElement('thead', { children: [row] });
}

function createPlayer(entry: LeaderboardEntry): HTMLElement {
  const color: string = AVATAR_COLORS[entry.rank - FIRST_PLACE] ?? FALLBACK_AVATAR_COLOR;
  const avatar: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__avatar',
    text: getInitials(entry.playerName),
    attributes: { 'aria-hidden': 'true', style: `--avatar-color: var(--color-${color})` },
  });
  const name: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__name',
    text: entry.playerName,
  });

  return createElement('span', { className: 'leaderboard__player', children: [avatar, name] });
}

function createStreak(days: number): HTMLElement {
  const flame: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__flame',
    text: '🔥',
    attributes: { 'aria-hidden': 'true' },
  });

  return createElement('span', {
    className: 'leaderboard__streak',
    children: [flame, ...createVariants(`${String(days)} days`, `${String(days)}d`)],
  });
}

function createRow(entry: LeaderboardEntry, index: number): HTMLTableRowElement {
  const rankClass: string =
    entry.rank === FIRST_PLACE ? 'leaderboard__rank leaderboard__rank--first' : 'leaderboard__rank';
  const favorite: HTMLSpanElement = createElement('span', {
    className: 'leaderboard__favorite',
    text: entry.favoriteGameName,
  });

  const cells: HTMLTableCellElement[] = [
    createCell('td', 'rank', [
      createElement('span', { className: rankClass, text: `#${String(entry.rank)}` }),
    ]),
    createCell('td', 'player', [createPlayer(entry)]),
    createCell('td', 'games', [String(entry.gamesPlayed)]),
    createCell(
      'td',
      'score',
      createVariants(entry.totalScore.toLocaleString('en-US'), formatCount(entry.totalScore)),
    ),
    createCell('td', 'streak', [createStreak(entry.streakDays)]),
    createCell('td', 'favorite', [favorite]),
  ];

  return createElement('tr', {
    className:
      index >= FIRST_EXTRA_ROW_INDEX
        ? 'leaderboard__row leaderboard__row--extra'
        : 'leaderboard__row',
    children: cells,
  });
}

export function createLeaderboard(): HTMLElement {
  const title: HTMLElement = createSectionTitle('Top Players This Week', TITLE_ID);
  const heading: Element | null = title.querySelector('h2');

  // The mobile layout shortens the heading to "Top Players".
  if (heading !== null) {
    heading.textContent = 'Top Players';
    heading.append(
      createElement('span', { className: 'leaderboard__title-suffix', text: ' This Week' }),
    );
  }

  const caption: HTMLTableCaptionElement = createElement('caption', {
    className: 'visually-hidden',
    text: 'Top players of the week ranked by total score',
  });
  const body: HTMLTableSectionElement = createElement('tbody', {
    children: leaderboard.map((entry: LeaderboardEntry, index: number): HTMLTableRowElement =>
      createRow(entry, index),
    ),
  });
  const table: HTMLTableElement = createElement('table', {
    className: 'leaderboard__table',
    children: [caption, createHead(), body],
  });
  const frame: HTMLElement = createElement('div', {
    className: 'leaderboard__frame',
    children: [table],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'leaderboard__inner',
    children: [title, frame],
  });

  return createElement('section', {
    className: 'leaderboard',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
