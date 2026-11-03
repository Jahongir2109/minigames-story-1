import {
  ChangeDetectionStrategy,
  Component,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Button } from '../button/button';

/**
 * Replaces an API-driven section whose request failed, so the rest of the page keeps working.
 * The Retry button is shown only when `retryable` is set.
 */
@Component({
  selector: 'app-error-banner',
  imports: [Button, TranslocoPipe],
  template: `
    <div class="error-banner__text">
      <p class="error-banner__title" [id]="titleId()">
        {{ title() ?? ('errors.title' | transloco) }}
      </p>
      <p class="error-banner__message">{{ message() }}</p>
    </div>
    @if (retryable()) {
      <button
        class="error-banner__retry"
        type="button"
        appButton
        variant="outline"
        size="small"
        (click)="retry.emit()"
      >
        {{ 'errors.tryAgain' | transloco }}
      </button>
    }
  `,
  styleUrl: './error-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert' },
})
export class ErrorBanner {
  readonly title: InputSignal<string | undefined> = input<string>();
  readonly message: InputSignal<string> = input.required<string>();
  readonly retryable: InputSignal<boolean> = input<boolean>(true);
  readonly titleId: InputSignal<string | null> = input<string | null>(null);

  /**
   * Repeats the failed request.
   */
  readonly retry: OutputEmitterRef<void> = output();
}
