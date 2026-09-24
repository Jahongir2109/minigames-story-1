import './game-records.scss';

import { createElement } from '@/shared/dom/create-element';
import type { TopRecord } from '@/shared/types/game';
import { formatRelativeTime, formatScore } from '@/shared/utils/format';

const TITLE_ID: string = 'game-records-title';

const MEDALS: Readonly<Record<number, string>> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function createRecord(record: TopRecord): HTMLLIElement {
  const player: HTMLParagraphElement = createElement('p', {
    className: 'game-records__player',
    children: [
      createElement('span', {
        className: 'game-records__medal',
        text: MEDALS[record.position] ?? String(record.position),
        attributes: { 'aria-hidden': 'true' },
      }),
      createElement('span', {
        className: 'visually-hidden',
        text: `Place ${String(record.position)}:`,
      }),
      record.playerName,
    ],
  });
  const result: HTMLParagraphElement = createElement('p', {
    className: 'game-records__result',
    children: [
      createElement('span', { text: `${formatScore(record.score)} pts` }),
      createElement('time', {
        className: 'game-records__date',
        text: formatRelativeTime(record.achievedAt),
        attributes: { datetime: record.achievedAt },
      }),
    ],
  });

  return createElement('li', { className: 'game-records__item', children: [player, result] });
}

/**
 * Best results of the game; informational only.
 */
export function createGameRecords(records: readonly TopRecord[]): HTMLElement {
  const title: HTMLHeadingElement = createElement('h3', {
    className: 'game-records__title',
    attributes: { id: TITLE_ID },
    children: [
      createElement('span', { text: '🏆', attributes: { 'aria-hidden': 'true' } }),
      'Top Records',
    ],
  });
  const list: HTMLOListElement = createElement('ol', {
    className: 'game-records__list',
    children: records.map((record: TopRecord): HTMLLIElement => createRecord(record)),
  });

  return createElement('section', {
    className: 'game-records',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [title, list],
  });
}
