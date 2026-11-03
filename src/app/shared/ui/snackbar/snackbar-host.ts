import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  inject,
  type Signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Icon } from '../icon/icon';
import { Snackbar, type SnackbarMessage } from './snackbar.service';

/**
 * Renders the Snackbar messages. The region is a manual popover, so it lives in the top layer
 * and stays visible above open modal dialogs.
 */
@Component({
  selector: 'app-snackbar-host',
  imports: [Icon, TranslocoPipe],
  template: `
    <div #region class="snackbar-region" popover="manual" aria-live="polite">
      @for (item of snackbar.messages(); track item.id) {
        <div
          class="snackbar"
          [class]="'snackbar--' + item.variant"
          [attr.role]="item.variant === 'error' ? 'alert' : 'status'"
          (pointerenter)="snackbar.pause(item.id)"
          (pointerleave)="snackbar.resume(item.id)"
          (focusin)="snackbar.pause(item.id)"
          (focusout)="snackbar.resume(item.id)"
        >
          <p class="snackbar__message">{{ item.message | transloco: item.params }}</p>
          <button
            class="snackbar__close"
            type="button"
            [attr.aria-label]="'snackbar.dismiss' | transloco"
            (click)="snackbar.dismiss(item.id)"
          >
            <app-icon class="snackbar__close-icon" name="close" />
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './snackbar-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarHost {
  private readonly region: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('region');
  // A manual popover is closed only by this component.
  private isShown: boolean = false;

  protected readonly snackbar: Snackbar = inject(Snackbar);

  constructor() {
    // Showing the popover again moves it above a dialog opened after it.
    effect(() => {
      const messages: readonly SnackbarMessage[] = this.snackbar.messages();
      const region: HTMLElement = this.region().nativeElement;

      if (this.isShown) {
        region.hidePopover();
        this.isShown = false;
      }

      if (messages.length === 0) {
        return;
      }

      region.showPopover();
      this.isShown = true;
    });
  }
}
