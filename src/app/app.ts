import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SnackbarHost } from '@/shared/ui/snackbar/snackbar-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackbarHost],
  template: `
    <main>
      <router-outlet />
    </main>
    <app-snackbar-host />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
