import { ChangeDetectionStrategy, Component, input, type InputSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { TopRecord } from '@/core/api/models';
import { RelativeTimePipe } from '@/shared/format/format.pipes';
import { LocalizedNumberPipe } from '@/shared/pipes/localized-number.pipe';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';

const MEDALS: Readonly<Record<number, string>> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/**
 * Best results of the game; informational only.
 */
@Component({
  selector: 'app-game-records',
  imports: [EmptyState, LocalizedNumberPipe, RelativeTimePipe, TranslocoPipe],
  template: `
    <section class="game-records" aria-labelledby="game-records-title">
      <h3 class="game-records__title" id="game-records-title">
        <span aria-hidden="true">🏆</span>
        {{ 'gameDialog.records' | transloco }}
      </h3>
      @if (records().length === 0) {
        <app-empty-state
          [title]="'gameDialog.noRecordsTitle' | transloco"
          [message]="'gameDialog.noRecordsMessage' | transloco"
        />
      } @else {
        <ol class="game-records__list">
          @for (record of records(); track record.position) {
            <li class="game-records__item">
              <p class="game-records__player">
                <span class="game-records__medal" aria-hidden="true">{{ medal(record) }}</span>
                <span class="visually-hidden">
                  {{ 'gameDialog.place' | transloco: { position: record.position } }}
                </span>
                {{ record.playerName }}
              </p>
              <p class="game-records__result">
                <span>
                  {{ 'gameDialog.points' | transloco: { score: (record.score | localizedNumber) } }}
                </span>
                <time class="game-records__date" [attr.datetime]="record.achievedAt">
                  {{ record.achievedAt | relativeTime }}
                </time>
              </p>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styleUrl: './game-records.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameRecords {
  readonly records: InputSignal<readonly TopRecord[]> = input.required<readonly TopRecord[]>();

  protected medal(record: TopRecord): string {
    return MEDALS[record.position] ?? String(record.position);
  }
}
