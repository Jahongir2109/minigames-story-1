import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  type InputSignal,
  linkedSignal,
  output,
  type OutputEmitterRef,
  type ResourceRef,
  type Signal,
  untracked,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';

import { ApiError, getErrorKey } from '@/core/api/api-error';
import { GamesApi } from '@/core/api/games-api';
import type { GameDetails } from '@/core/api/models';
import type { AppSession } from '@/core/auth/session';
import { reportFailures } from '@/shared/data/report-failures';
import { EmptyState } from '@/shared/ui/empty-state/empty-state';
import { ErrorBanner } from '@/shared/ui/error-banner/error-banner';
import { Icon } from '@/shared/ui/icon/icon';
import { ScrollLock } from '@/shared/ui/scroll-lock';

import { CommentForm } from './comment-form';
import { FavoriteButton } from './favorite-button';
import { GameComments } from './game-comments';
import { GameInfo } from './game-info';
import { GameRecords } from './game-records';

export const GAME_DIALOG_TITLE_ID: string = 'game-dialog-title';
const SKELETON_LINES: readonly number[] = [1, 2, 3, 4];

interface DetailsRequest {
  slug: string;
  userEmail: string | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound;
}

/**
 * Game Details dialog: the details of the game in the URL and its latest comments, personalized
 * for the signed-in user. It is shown while `slug` is set; `hidden` keeps the loaded game while
 * Auth is shown over it.
 */
@Component({
  selector: 'app-game-dialog',
  imports: [
    CommentForm,
    EmptyState,
    FavoriteButton,
    ErrorBanner,
    GameComments,
    GameInfo,
    GameRecords,
    Icon,
    NgTemplateOutlet,
    TranslocoPipe,
  ],
  template: `
    <dialog #dialog class="game-dialog" [attr.aria-labelledby]="titleId" (close)="onClosed()">
      <div #surface class="game-dialog__surface">
        <ng-template #closeButton>
          <button
            class="game-dialog__close"
            type="button"
            [attr.aria-label]="'gameDialog.close' | transloco"
            (click)="dismiss()"
          >
            <app-icon class="game-dialog__close-icon" name="close" />
          </button>
        </ng-template>

        @if (details.isLoading()) {
          <div class="game-dialog__hero">
            <span
              class="skeleton skeleton--block game-dialog__hero-skeleton"
              aria-hidden="true"
            ></span>
            <ng-container [ngTemplateOutlet]="closeButton" />
          </div>
          <div
            class="game-dialog__body game-dialog__skeleton"
            role="status"
            aria-busy="true"
            [attr.aria-label]="'gameDialog.loading' | transloco"
          >
            <span
              class="skeleton skeleton--text game-dialog__skeleton-title"
              aria-hidden="true"
            ></span>
            @for (line of skeletonLines; track line) {
              <span
                class="skeleton skeleton--text game-dialog__skeleton-line"
                aria-hidden="true"
              ></span>
            }
            <span
              class="skeleton skeleton--block game-dialog__skeleton-block"
              aria-hidden="true"
            ></span>
          </div>
        } @else if (details.error(); as error) {
          <!-- Error and "not found" states have no hero image, so the close button gets a bar. -->
          <div class="game-dialog__bar"><ng-container [ngTemplateOutlet]="closeButton" /></div>
          <div class="game-dialog__body">
            @if (isNotFound(error)) {
              <app-empty-state
                [title]="'gameDialog.notFoundTitle' | transloco"
                [message]="'gameDialog.notFoundMessage' | transloco: { slug: slug() ?? '' }"
                [titleId]="titleId"
              />
            } @else {
              <app-error-banner
                [title]="'gameDialog.failed' | transloco"
                [message]="errorKey(error) | transloco"
                [titleId]="titleId"
                (retry)="details.reload()"
              />
            }
          </div>
        } @else if (details.hasValue()) {
          @let game = details.value();
          <div class="game-dialog__hero">
            <img
              class="game-dialog__hero-image"
              [src]="game.heroImage"
              [alt]="'gameDialog.heroAlt' | transloco: { name: game.name }"
            />
            <ng-container [ngTemplateOutlet]="closeButton" />
          </div>
          <div class="game-dialog__body">
            <app-game-info [game]="game" [titleId]="titleId" [likesCount]="likesCount()">
              <app-favorite-button
                [slug]="game.slug"
                [favorited]="game.isLikedByCurrentUser"
                (likesChange)="likesCount.set($event)"
              />
            </app-game-info>
            <app-game-records [records]="game.topRecords" />
            <app-game-comments #comments [slug]="game.slug" [userEmail]="userEmail()">
              <app-comment-form [slug]="game.slug" [user]="user()" (posted)="comments.reload()" />
            </app-game-comments>
          </div>
        }
      </div>
    </dialog>
  `,
  styleUrl: './game-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'onDialogClick($event)' },
})
export class GameDialog {
  private readonly api: GamesApi = inject(GamesApi);
  private readonly scrollLock: ScrollLock = inject(ScrollLock);
  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly surface: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('surface');
  // The app closes the dialog itself (URL change, Auth on top): that is not a close by the user.
  private isClosingByApp: boolean = false;
  private isLocked: boolean = false;

  /**
   * The game in the URL; `undefined` closes the dialog.
   */
  readonly slug: InputSignal<string | undefined> = input<string>();
  /**
   * Hidden while Auth is shown instead; the loaded game stays.
   */
  readonly hidden: InputSignal<boolean> = input<boolean>(false);
  /**
   * The signed-in user: personalizes the favorite and the comment likes. A change reloads them.
   */
  readonly user: InputSignal<AppSession | undefined> = input<AppSession>();
  /**
   * The user closed the dialog (button, backdrop or Escape).
   */
  readonly closed: OutputEmitterRef<void> = output();

  protected readonly titleId: string = GAME_DIALOG_TITLE_ID;
  protected readonly userEmail: Signal<string | undefined> = computed(() => this.user()?.email);
  // The like count that the server returned with the last favorite change of this game.
  protected readonly likesCount: WritableSignal<number | null> = linkedSignal(() => {
    this.slug();
    this.userEmail();

    return null;
  });
  protected readonly skeletonLines: readonly number[] = SKELETON_LINES;
  protected readonly details: ResourceRef<GameDetails | undefined> = rxResource({
    params: (): DetailsRequest | undefined => {
      const slug: string | undefined = this.slug();

      return slug === undefined ? undefined : { slug, userEmail: this.userEmail() };
    },
    stream: ({ params }: { params: DetailsRequest }) =>
      this.api.gameDetails(params.slug, params.userEmail),
  });

  constructor() {
    reportFailures(this.details, 'gameDialog.failedNotice', (error: unknown) => !isNotFound(error));

    // A new game starts at the top of the dialog.
    effect(() => {
      this.slug();
      untracked(() => {
        this.surface().nativeElement.scrollTop = 0;
      });
    });

    effect(() => {
      const isShown: boolean = this.slug() !== undefined && !this.hidden();

      untracked(() => {
        this.sync(isShown);
      });
    });
  }

  private sync(isShown: boolean): void {
    const dialog: HTMLDialogElement = this.dialog().nativeElement;

    if (isShown && !dialog.open) {
      dialog.showModal();
      this.lock(true);
    } else if (!isShown && dialog.open) {
      this.isClosingByApp = true;
      dialog.close();
    }
  }

  private lock(isLocked: boolean): void {
    if (isLocked === this.isLocked) {
      return;
    }

    this.isLocked = isLocked;

    if (isLocked) {
      this.scrollLock.lock();
    } else {
      this.scrollLock.unlock();
    }
  }

  protected dismiss(): void {
    this.dialog().nativeElement.close();
  }

  // Covers the close button, the backdrop, the Escape key and the closes of the app.
  protected onClosed(): void {
    this.lock(false);

    if (this.isClosingByApp) {
      this.isClosingByApp = false;
      return;
    }

    this.closed.emit();
  }

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.dismiss();
    }
  }

  protected isNotFound(error: unknown): boolean {
    return isNotFound(error);
  }

  protected errorKey(error: unknown): string {
    return getErrorKey(error);
  }
}
