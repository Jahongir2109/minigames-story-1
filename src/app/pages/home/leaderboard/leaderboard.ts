import { ChangeDetectionStrategy, Component, inject, type ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';

import { getErrorKey } from '@/core/api/api-error';
import { GamesApi } from '@/core/api/games-api';
import type { LeaderboardEntry } from '@/core/api/models';
import { reportFailures } from '@/shared/data/report-failures';
import { CompactCountPipe } from '@/shared/format/format.pipes';
import { getInitials } from '@/shared/format/player';
import { LocalizedNumberPipe } from '@/shared/pipes/localized-number.pipe';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';
import { ErrorBanner } from '@/shared/ui/error-banner/error-banner';
import { SectionTitle } from '@/shared/ui/section-title/section-title';

type Column = 'rank' | 'player' | 'games' | 'score' | 'streak' | 'favorite';

/**
 * Header labels: `full` on desktop, `short` on tablet and mobile (translation keys).
 */
interface ColumnDefinition {
  column: Column;
  full: string;
  short: string;
}

const COLUMNS: readonly ColumnDefinition[] = [
  { column: 'rank', full: 'leaderboard.rank', short: 'leaderboard.rank' },
  { column: 'player', full: 'leaderboard.player', short: 'leaderboard.player' },
  { column: 'games', full: 'leaderboard.gamesPlayed', short: 'leaderboard.games' },
  { column: 'score', full: 'leaderboard.totalScore', short: 'leaderboard.score' },
  { column: 'streak', full: 'leaderboard.streak', short: 'leaderboard.streak' },
  { column: 'favorite', full: 'leaderboard.favorite', short: 'leaderboard.favorite' },
];

// The design colors the avatars by rank (first place uses the primary yellow).
const AVATAR_COLORS: readonly string[] = [
  'primary',
  'avatar-random-2',
  'avatar-random-3',
  'avatar-random-4',
  'avatar-random-5',
];
const FALLBACK_AVATAR_COLOR: string = 'avatar-random-1';
const FIRST_PLACE: number = 1;
// Rows from the fourth one on are shown on desktop only.
const FIRST_EXTRA_ROW_INDEX: number = 3;
// Placeholder rows while the leaderboard loads (the design shows the top five players).
const SKELETON_ROWS: readonly number[] = [1, 2, 3, 4, 5];

/**
 * "Top Players This Week" table; the rows come from the API.
 */
@Component({
  selector: 'app-leaderboard',
  imports: [
    CompactCountPipe,
    EmptyState,
    ErrorBanner,
    LocalizedNumberPipe,
    SectionTitle,
    TranslocoPipe,
  ],
  template: `
    <section class="leaderboard" aria-labelledby="leaderboard-title">
      <div class="leaderboard__inner">
        <app-section-title headingId="leaderboard-title">
          <span class="leaderboard__title-short">{{ 'leaderboard.titleShort' | transloco }}</span>
          <span class="leaderboard__title-full">{{ 'leaderboard.title' | transloco }}</span>
        </app-section-title>
        <div class="leaderboard__content">
          @if (players.isLoading()) {
            <div
              class="leaderboard__frame leaderboard__skeleton"
              role="status"
              aria-busy="true"
              [attr.aria-label]="'leaderboard.loading' | transloco"
            >
              @for (row of skeletonRows; track row) {
                <span
                  class="skeleton skeleton--block leaderboard__skeleton-row"
                  aria-hidden="true"
                ></span>
              }
            </div>
          } @else if (players.error(); as error) {
            <app-error-banner
              [title]="'leaderboard.failed' | transloco"
              [message]="errorKey(error) | transloco"
              (retry)="players.reload()"
            />
          } @else if (players.hasValue() && players.value().length > 0) {
            <div class="leaderboard__frame">
              <table class="leaderboard__table">
                <caption class="visually-hidden">
                  {{
                    'leaderboard.caption' | transloco
                  }}
                </caption>
                <thead>
                  <tr class="leaderboard__row">
                    @for (definition of columns; track definition.column) {
                      <th
                        class="leaderboard__cell"
                        scope="col"
                        [class]="'leaderboard__cell--' + definition.column"
                      >
                        @if (definition.full === definition.short) {
                          {{ definition.full | transloco }}
                        } @else {
                          <span class="leaderboard__full">{{ definition.full | transloco }}</span>
                          <span class="leaderboard__short">{{ definition.short | transloco }}</span>
                        }
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (entry of players.value(); track entry.rank; let index = $index) {
                    <tr
                      class="leaderboard__row"
                      [class.leaderboard__row--extra]="index >= firstExtraRow"
                    >
                      <td class="leaderboard__cell leaderboard__cell--rank">
                        <span
                          class="leaderboard__rank"
                          [class.leaderboard__rank--first]="entry.rank === firstPlace"
                        >
                          #{{ entry.rank }}
                        </span>
                      </td>
                      <td class="leaderboard__cell leaderboard__cell--player">
                        <span class="leaderboard__player">
                          <span
                            class="leaderboard__avatar"
                            aria-hidden="true"
                            [style.--avatar-color]="avatarColor(entry)"
                          >
                            {{ initials(entry) }}
                          </span>
                          <span class="leaderboard__name">{{ entry.playerName }}</span>
                        </span>
                      </td>
                      <td class="leaderboard__cell leaderboard__cell--games">
                        {{ entry.gamesPlayed | localizedNumber }}
                      </td>
                      <td class="leaderboard__cell leaderboard__cell--score">
                        <span class="leaderboard__full">{{
                          entry.totalScore | localizedNumber
                        }}</span>
                        <span class="leaderboard__short">{{
                          entry.totalScore | compactCount
                        }}</span>
                      </td>
                      <td class="leaderboard__cell leaderboard__cell--streak">
                        <span class="leaderboard__streak">
                          <span class="leaderboard__flame" aria-hidden="true">🔥</span>
                          <span class="leaderboard__full">
                            {{ 'leaderboard.days' | transloco: { count: entry.streakDays } }}
                          </span>
                          <span class="leaderboard__short">
                            {{ 'leaderboard.daysShort' | transloco: { count: entry.streakDays } }}
                          </span>
                        </span>
                      </td>
                      <td class="leaderboard__cell leaderboard__cell--favorite">
                        <span class="leaderboard__favorite">{{ entry.favoriteGameName }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <app-empty-state
              [title]="'leaderboard.emptyTitle' | transloco"
              [message]="'leaderboard.emptyMessage' | transloco"
            />
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './leaderboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Leaderboard {
  private readonly api: GamesApi = inject(GamesApi);

  protected readonly players: ResourceRef<LeaderboardEntry[] | undefined> = rxResource({
    stream: () => this.api.leaderboard(),
  });
  protected readonly columns: readonly ColumnDefinition[] = COLUMNS;
  protected readonly skeletonRows: readonly number[] = SKELETON_ROWS;
  protected readonly firstPlace: number = FIRST_PLACE;
  protected readonly firstExtraRow: number = FIRST_EXTRA_ROW_INDEX;

  constructor() {
    reportFailures(this.players, 'leaderboard.failedNotice');
  }

  protected errorKey(error: unknown): string {
    return getErrorKey(error);
  }

  protected initials(entry: LeaderboardEntry): string {
    return getInitials(entry.playerName);
  }

  protected avatarColor(entry: LeaderboardEntry): string {
    const color: string = AVATAR_COLORS[entry.rank - FIRST_PLACE] ?? FALLBACK_AVATAR_COLOR;

    return `var(--color-${color})`;
  }
}
