import { Location } from '@angular/common';
import { computed, inject, Injectable, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type Event, NavigationEnd, type ParamMap, type Params, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * Query keys of the dialogs: `?game=<game-slug>` and `?auth=login` / `?auth=register`. They are
 * added to the URL of the page under the dialog, e.g. `/library?category=arcade&page=2&game=<slug>`.
 */
export type DialogKey = 'game' | 'auth';

const DIALOG_KEYS: readonly DialogKey[] = ['game', 'auth'];

// Marks the history entries that were added by opening a dialog in the app.
interface DialogHistoryState {
  isDialog: true;
}

export interface OpenDialogOptions {
  /**
   * Keeps the dialog that is already in the URL under the new one (Auth over Game Details), so
   * closing the new dialog goes back to it.
   */
  stack?: boolean;
}

function isDialogEntry(state: unknown): state is DialogHistoryState {
  return typeof state === 'object' && state !== null && 'isDialog' in state;
}

/**
 * The dialogs follow the URL: opening one writes it into the URL and the app opens the dialog
 * from there, so a dialog can be linked, reloaded and closed with Back. Normally one dialog is in
 * the URL at a time.
 */
@Injectable({ providedIn: 'root' })
export class DialogUrl {
  private readonly router: Router = inject(Router);
  private readonly location: Location = inject(Location);

  private readonly query: Signal<ParamMap> = toSignal(
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
      map(() => this.currentQuery()),
    ),
    { initialValue: this.currentQuery() },
  );

  readonly game: Signal<string | undefined> = computed(() => this.read('game'));
  readonly auth: Signal<string | undefined> = computed(() => this.read('auth'));

  private currentQuery(): ParamMap {
    return this.router.parseUrl(this.router.url).queryParamMap;
  }

  private read(key: DialogKey): string | undefined {
    const value: string | null = this.query().get(key);

    return value === null || value === '' ? undefined : value;
  }

  // Only the query changes: the path of the page stays.
  private navigate(changes: Params, shouldReplace: boolean, state: unknown): void {
    void this.router.navigate([], {
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl: shouldReplace,
      ...(isDialogEntry(state) && { state: { isDialog: true } }),
    });
  }

  /**
   * Opens a dialog by writing it into the URL. A dialog that is already open (e.g. the auth mode
   * tabs) replaces its history entry instead of adding one.
   */
  open(key: DialogKey, value: string, options: OpenDialogOptions = {}): void {
    const current: ParamMap = this.currentQuery();
    const state: unknown = this.location.getState();

    if (current.has(key)) {
      this.navigate({ [key]: value }, true, state);
      return;
    }

    const isDialogOpen: boolean = DIALOG_KEYS.some((dialog: DialogKey) => current.has(dialog));
    const shouldStack: boolean = options.stack === true;
    const changes: Params = { [key]: value };

    if (!shouldStack) {
      for (const dialog of DIALOG_KEYS) {
        if (dialog !== key) {
          changes[dialog] = null;
        }
      }
    }

    // Switching from one dialog to another keeps a single Back step to the page.
    if (isDialogOpen && !shouldStack) {
      this.navigate(changes, true, state);
    } else {
      this.navigate(changes, false, { isDialog: true });
    }
  }

  /**
   * Removes a dialog that must not open (e.g. Auth for a signed-in user) from the current history
   * entry, without a new Back entry.
   */
  remove(key: DialogKey): void {
    if (this.currentQuery().has(key)) {
      this.navigate({ [key]: null }, true, this.location.getState());
    }
  }

  /**
   * Removes a closed dialog from the URL. When the dialog was opened in the app, this goes back to
   * the page entry under it (so Back does not reopen it); a dialog opened from a link replaces its
   * entry with the URL of the page.
   */
  close(key: DialogKey): void {
    if (!this.currentQuery().has(key)) {
      return;
    }

    if (isDialogEntry(this.location.getState())) {
      this.location.back();
      return;
    }

    this.remove(key);
  }
}
