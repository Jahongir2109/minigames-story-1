import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';

import { DialogUrl } from '@/core/dialogs/dialog-url';

import { GameDialog } from './game-dialog/game-dialog';

export type AuthMode = 'login' | 'register';

export function isAuthMode(value: string | undefined): value is AuthMode {
  return value === 'login' || value === 'register';
}

/**
 * Opens, switches and closes the dialogs to match the URL (app actions, links, Back / Forward,
 * reloads). Auth over Game Details hides the game until Auth closes.
 */
@Component({
  selector: 'app-dialog-host',
  imports: [GameDialog],
  template: `
    <app-game-dialog
      [slug]="dialogs.game()"
      [hidden]="isAuthRequested()"
      (closed)="dialogs.close('game')"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHost {
  protected readonly dialogs: DialogUrl = inject(DialogUrl);
  protected readonly isAuthRequested: Signal<boolean> = computed(() =>
    isAuthMode(this.dialogs.auth()),
  );
}
