import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CurrentPage } from '@/core/navigation/current-page';
import { DialogHost } from '@/dialogs/dialog-host';
import { Footer } from '@/layout/footer/footer';
import { Header } from '@/layout/header/header';
import { SnackbarHost } from '@/shared/ui/snackbar/snackbar-host';

@Component({
  selector: 'app-root',
  imports: [DialogHost, Footer, Header, RouterOutlet, SnackbarHost],
  template: `
    <app-header />
    <main id="main-content">
      <router-outlet />
    </main>
    <app-footer />
    <app-dialog-host />
    <app-snackbar-host />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    main {
      flex-grow: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // Created with the app, so the very first navigation is tracked too.
    inject(CurrentPage);
  }
}
