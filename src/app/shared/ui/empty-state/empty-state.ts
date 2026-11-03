import { ChangeDetectionStrategy, Component, input, type InputSignal } from '@angular/core';

/**
 * Shown in place of a list when the request succeeded but returned no items. An optional way
 * out (e.g. a "Show all games" button) is projected below the text.
 */
@Component({
  selector: 'app-empty-state',
  template: `
    <p class="empty-state__title" [id]="titleId()">{{ title() }}</p>
    @if (message(); as text) {
      <p class="empty-state__message">{{ text }}</p>
    }
    <div class="empty-state__action"><ng-content /></div>
  `,
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class EmptyState {
  readonly title: InputSignal<string> = input.required<string>();
  readonly message: InputSignal<string | undefined> = input<string>();
  /**
   * Lets a dialog use the title as its accessible name.
   */
  readonly titleId: InputSignal<string | null> = input<string | null>(null);
}
