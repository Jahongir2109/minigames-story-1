import type { SessionStore } from '@/auth/session';
import type { AuthDialog } from '@/components/auth-dialog/auth-dialog';
import type { AuthMode } from '@/components/auth-dialog/auth-forms';
import type { GameDialog } from '@/components/game-dialog/game-dialog';

import { getDialogParameter, removeDialogUrl } from './dialog-url';

export const ALREADY_AUTHENTICATED_MESSAGE: string = 'You are already logged in.';

export interface DialogSyncOptions {
  authDialog: Pick<AuthDialog, 'open' | 'close'>;
  gameDialog: Pick<GameDialog, 'open' | 'hide' | 'close'>;
  session: Pick<SessionStore, 'check'>;
  /**
   * Tells a signed-in user why Auth did not open.
   */
  onAlreadyAuthenticated: () => void;
}

export function isAuthMode(value: string | undefined): value is AuthMode {
  return value === 'login' || value === 'register';
}

/**
 * Opens, switches or closes the dialogs to match the URL (app actions, links, Back / Forward,
 * reloads). Auth opens only for a guest: for a valid session its parameter is removed from the
 * current entry. Auth over Game Details hides the game until Auth closes.
 */
export function createDialogSync(options: DialogSyncOptions): () => void {
  const { authDialog, gameDialog } = options;

  return (): void => {
    const slug: string | undefined = getDialogParameter('game');
    const mode: string | undefined = getDialogParameter('auth');
    const isAuthRequested: boolean = isAuthMode(mode);

    // An expired or broken session is cleared by the check, so such a user gets Auth.
    if (isAuthRequested && options.session.check() !== undefined) {
      // The URL change syncs the dialogs again, now without Auth.
      removeDialogUrl('auth');
      options.onAlreadyAuthenticated();
      return;
    }

    if (!isAuthRequested) {
      authDialog.close();
    }

    if (slug === undefined) {
      gameDialog.close();
    } else if (isAuthRequested) {
      gameDialog.hide(slug);
    } else {
      gameDialog.open(slug);
    }

    if (isAuthMode(mode)) {
      authDialog.open(mode);
    }
  };
}
