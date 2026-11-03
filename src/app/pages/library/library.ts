import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  type ResourceRef,
  type Signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type ParamMap, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { ApiError, getErrorKey } from '@/core/api/api-error';
import { GamesApi } from '@/core/api/games-api';
import type { ApiResponse, Game, GameCategory, GamesMeta, GamesQuery } from '@/core/api/models';
import { DialogUrl } from '@/core/dialogs/dialog-url';
import { LIBRARY_PATH } from '@/core/navigation/links';
import { reportFailures } from '@/shared/data/report-failures';
import { Button } from '@/shared/ui/button/button';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';
import { ErrorBanner } from '@/shared/ui/error-banner/error-banner';

import { FilterChips } from './filter-chips/filter-chips';
import { LibraryCard } from './library-card/library-card';
import {
  DEFAULT_SORT,
  hasInvalidLibraryQuery,
  isSameLibraryState,
  LIBRARY_PAGE_SIZE,
  type LibraryState,
  readLibraryState,
  toLibraryQuery,
} from './library-state';
import { Pagination } from './pagination/pagination';
import { SortDropdown } from './sort-dropdown/sort-dropdown';

// Used until the categories arrive, and when they can not be loaded.
const FALLBACK_CATEGORY: string = 'all';
const SKELETON_CHIPS: readonly number[] = [1, 2, 3, 4, 5];
const SKELETON_CARDS: readonly number[] = Array.from(
  { length: LIBRARY_PAGE_SIZE },
  (_: unknown, index: number) => index,
);

// An unknown category in a typed or outdated link: the API answers 400.
function isUnknownCategory(error: unknown): boolean {
  return error instanceof ApiError && error.isBadRequest;
}

/**
 * Library page. Its filter, sort and page live in the URL: the controls only navigate, and every
 * URL change (a click, Back / Forward, a pasted link) restores the controls and requests the
 * matching games; an older request is cancelled by the newer one.
 */
@Component({
  selector: 'app-library',
  imports: [
    Button,
    EmptyState,
    ErrorBanner,
    FilterChips,
    LibraryCard,
    Pagination,
    SortDropdown,
    TranslocoPipe,
  ],
  template: `
    <section class="library" aria-labelledby="library-title">
      <header class="library__intro">
        <h1 class="library__title" id="library-title">{{ 'library.title' | transloco }}</h1>
        <p class="library__subtitle">{{ 'library.subtitle' | transloco }}</p>
      </header>
      <div class="library__toolbar">
        <div class="library__chips">
          @if (categories.isLoading()) {
            <div
              class="library__skeleton-chips"
              role="status"
              aria-busy="true"
              [attr.aria-label]="'library.loadingCategories' | transloco"
            >
              @for (chip of skeletonChips; track chip) {
                <span
                  class="skeleton skeleton--block library__skeleton-chip"
                  aria-hidden="true"
                ></span>
              }
            </div>
          } @else if (categories.error(); as error) {
            <app-error-banner
              [title]="'library.categoriesFailed' | transloco"
              [message]="errorKey(error) | transloco"
              (retry)="categories.reload()"
            />
          } @else {
            <app-filter-chips
              [categories]="categories.value() ?? []"
              [value]="activeCategory()"
              (changed)="go({ category: $event, sort: state().sort, page: 1 })"
            />
          }
        </div>
        <app-sort-dropdown
          [value]="state().sort"
          (changed)="go({ category: state().category, sort: $event, page: 1 })"
        />
      </div>
      <section class="library__games" [attr.aria-label]="'library.games' | transloco">
        @if (games.isLoading()) {
          <div
            class="library__list"
            role="status"
            aria-busy="true"
            [attr.aria-label]="'library.loadingGames' | transloco"
          >
            @for (card of skeletonCards; track card) {
              <span
                class="skeleton skeleton--block library__skeleton-card"
                aria-hidden="true"
              ></span>
            }
          </div>
        } @else if (list().length > 0) {
          <ul class="library__list">
            @for (game of list(); track game.slug) {
              <li>
                <app-library-card
                  [game]="game"
                  [categoryLabel]="apiLabel(game.category)"
                  (details)="openGame(game)"
                />
              </li>
            }
          </ul>
        } @else if (failure(); as error) {
          <app-error-banner
            [title]="'library.gamesFailed' | transloco"
            [message]="errorKey(error) | transloco"
            (retry)="games.reload()"
          />
        } @else {
          <app-empty-state
            [title]="'library.notFoundTitle' | transloco"
            [message]="'library.notFoundMessage' | transloco"
          >
            @if (canReset()) {
              <button type="button" appButton size="small" (click)="reset()">
                {{ 'library.showAll' | transloco }}
              </button>
            }
          </app-empty-state>
        }
      </section>
      <div class="library__pagination">
        <app-pagination
          [page]="pagination().page"
          [totalPages]="pagination().total"
          (changed)="go({ category: state().category, sort: state().sort, page: $event })"
        />
      </div>
    </section>
  `,
  styleUrl: './library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Library {
  private readonly api: GamesApi = inject(GamesApi);
  private readonly router: Router = inject(Router);
  private readonly dialogs: DialogUrl = inject(DialogUrl);
  private readonly query: Signal<ParamMap> = toSignal(inject(ActivatedRoute).queryParamMap, {
    requireSync: true,
  });
  // The last known page count, so the requested page is shown while it loads.
  private knownTotalPages: number = 1;

  // Opening or closing a dialog changes the URL but not the list.
  protected readonly state: Signal<LibraryState> = computed(() => readLibraryState(this.query()), {
    equal: isSameLibraryState,
  });

  protected readonly categories: ResourceRef<GameCategory[] | undefined> = rxResource({
    stream: () => this.api.categories(),
  });

  protected readonly games: ResourceRef<ApiResponse<Game[], GamesMeta> | undefined> = rxResource({
    params: (): GamesQuery => {
      const { category, sort, page } = this.state();

      return {
        ...(category !== undefined && { category }),
        sort,
        page,
        limit: LIBRARY_PAGE_SIZE,
      };
    },
    stream: ({ params }: { params: GamesQuery }) => this.api.games(params),
  });

  protected readonly defaultCategory: Signal<string> = computed(() =>
    this.categories.hasValue()
      ? (this.categories.value().find((category: GameCategory) => category.isDefault)?.slug ??
        FALLBACK_CATEGORY)
      : FALLBACK_CATEGORY,
  );

  protected readonly activeCategory: Signal<string> = computed(
    () => this.state().category ?? this.defaultCategory(),
  );

  protected readonly list: Signal<readonly Game[]> = computed(() =>
    this.games.hasValue() ? this.games.value().data : [],
  );

  /**
   * A failure that is shown as an error banner; an unknown category is "not found" instead.
   */
  protected readonly failure: Signal<unknown> = computed(() => {
    const error: unknown = this.games.error();

    return isUnknownCategory(error) ? undefined : error;
  });

  protected readonly pagination: Signal<{ page: number; total: number }> = computed(() => {
    const page: number = this.state().page;

    if (this.games.isLoading()) {
      return { page, total: Math.max(this.knownTotalPages, page) };
    }

    return this.games.hasValue()
      ? { page: this.games.value().meta.page, total: this.games.value().meta.totalPages }
      : { page: 1, total: 1 };
  });

  protected readonly skeletonChips: readonly number[] = SKELETON_CHIPS;
  protected readonly skeletonCards: readonly number[] = SKELETON_CARDS;

  constructor() {
    reportFailures(this.categories, 'library.categoriesFailedNotice');
    reportFailures(
      this.games,
      'library.gamesFailedNotice',
      (error: unknown) => !isUnknownCategory(error),
    );

    effect(() => {
      const { total } = this.pagination();

      if (!this.games.isLoading()) {
        this.knownTotalPages = total;
      }
    });

    // A broken sort or page in the address is replaced by its default, without a history entry.
    effect(() => {
      const query: ParamMap = this.query();

      if (!hasInvalidLibraryQuery(query)) {
        return;
      }

      untracked(() => {
        void this.router.navigate([], {
          queryParams: toLibraryQuery(this.state()),
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    });
  }

  protected errorKey(error: unknown): string {
    return getErrorKey(error);
  }

  /**
   * The English label of the API, for categories the app has no translation of.
   */
  protected apiLabel(slug: string): string | undefined {
    return this.categories.hasValue()
      ? this.categories.value().find((category: GameCategory) => category.slug === slug)?.label
      : undefined;
  }

  protected canReset(): boolean {
    const { sort, page } = this.state();

    return this.activeCategory() !== this.defaultCategory() || sort !== DEFAULT_SORT || page > 1;
  }

  /**
   * Every control writes the new state into the URL; an open dialog is closed by that.
   */
  protected go(next: LibraryState): void {
    void this.router.navigate([LIBRARY_PATH], { queryParams: toLibraryQuery(next) });
  }

  // The way out of an empty result: the Library with its default filter, sort and page.
  protected reset(): void {
    void this.router.navigate([LIBRARY_PATH]);
  }

  protected openGame(game: Game): void {
    this.dialogs.open('game', game.slug);
  }
}
