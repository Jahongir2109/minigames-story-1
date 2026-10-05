import { navigate } from './navigation';

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

function isDialogEntry(state: unknown): state is DialogHistoryState {
  return typeof state === 'object' && state !== null && 'isDialog' in state;
}

// Only the query changes: the path and the hash of the page stay.
function buildUrl(parameters: URLSearchParams): string {
  const query: string = parameters.toString();

  return `${location.pathname}${query === '' ? '' : `?${query}`}${location.hash}`;
}

export function getDialogParameter(key: DialogKey): string | undefined {
  const value: string | null = new URLSearchParams(location.search).get(key);

  return value === null || value === '' ? undefined : value;
}

export interface OpenDialogOptions {
  /**
   * Keeps the dialog that is already in the URL under the new one (Auth over Game Details), so
   * closing the new dialog goes back to it.
   */
  stack?: boolean;
}

/**
 * Opens a dialog by writing it into the URL; the app opens the dialog from the URL. Normally one
 * dialog is in the URL at a time. A dialog that is already open (e.g. the auth mode tabs) replaces
 * its history entry instead of adding one.
 */
export function openDialogUrl(
  key: DialogKey,
  value: string,
  options: OpenDialogOptions = {},
): void {
  const parameters: URLSearchParams = new URLSearchParams(location.search);

  if (parameters.has(key)) {
    parameters.set(key, value);
    navigate(buildUrl(parameters), { replace: true });
    return;
  }

  const state: DialogHistoryState = { isDialog: true };
  const isDialogOpen: boolean = DIALOG_KEYS.some((dialog: DialogKey): boolean =>
    parameters.has(dialog),
  );

  if (options.stack !== true) {
    for (const dialog of DIALOG_KEYS) {
      parameters.delete(dialog);
    }
  }

  parameters.set(key, value);
  navigate(
    buildUrl(parameters),
    isDialogOpen && options.stack !== true ? { replace: true } : { state },
  );
}

/**
 * Removes a dialog that must not open (e.g. Auth for a signed-in user) from the current history
 * entry, without a reload and without a new Back entry.
 */
export function removeDialogUrl(key: DialogKey): void {
  const parameters: URLSearchParams = new URLSearchParams(location.search);

  if (!parameters.has(key)) {
    return;
  }

  parameters.delete(key);
  navigate(buildUrl(parameters), { replace: true });
}

/**
 * Removes a closed dialog from the URL. When the dialog was opened in the app, this goes back to
 * the page entry under it (so Back does not reopen it); a dialog opened from a link replaces its
 * entry with the URL of the page.
 */
export function closeDialogUrl(key: DialogKey): void {
  const parameters: URLSearchParams = new URLSearchParams(location.search);

  if (!parameters.has(key)) {
    return;
  }

  if (isDialogEntry(history.state)) {
    history.back();
    return;
  }

  removeDialogUrl(key);
}
