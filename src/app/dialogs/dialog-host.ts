import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  type Signal,
  untracked,
} from '@angular/core';

import { Session } from '@/core/auth/session.service';
import { DialogUrl } from '@/core/dialogs/dialog-url';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { AuthDialog, type AuthMode } from './auth-dialog/auth-dialog';
import { GameDialog } from './game-dialog/game-dialog';

export function isAuthMode(value: string | undefined): value is AuthMode {
  return value === 'login' || value === 'register';
}

/**
 * Opens, switches and closes the dialogs to match the URL (app actions, links, Back / Forward,
 * reloads). Auth opens only for a guest; Auth over Game Details hides the game until Auth closes.
 * The game follows the signed-in user (favorite and likes).
 */
@Component({
  selector: 'app-dialog-host',
  imports: [AuthDialog, GameDialog],
  template: `
    <app-game-dialog
      [slug]="dialogs.game()"
      [hidden]="authMode() !== undefined"
      [userEmail]="session.user()?.email"
      (closed)="dialogs.close('game')"
    />
    <app-auth-dialog
      [mode]="authMode()"
      (modeChange)="dialogs.open('auth', $event)"
      (closed)="dialogs.close('auth')"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHost {
  private readonly snackbar: Snackbar = inject(Snackbar);

  protected readonly dialogs: DialogUrl = inject(DialogUrl);
  protected readonly session: Session = inject(Session);
  protected readonly authMode: Signal<AuthMode | undefined> = computed(() => {
    const mode: string | undefined = this.dialogs.auth();

    return isAuthMode(mode) && !this.session.isSignedIn() ? mode : undefined;
  });

  constructor() {
    // Auth never opens for a signed-in user: the parameter leaves the URL and the user is told.
    effect(() => {
      if (!isAuthMode(this.dialogs.auth())) {
        return;
      }

      untracked(() => {
        // An expired or broken session is cleared by the check, so such a user gets Auth.
        if (this.session.check() === undefined) {
          return;
        }

        this.dialogs.remove('auth');
        this.snackbar.show({ message: 'auth.already', variant: 'info' });
      });
    });
  }
}
