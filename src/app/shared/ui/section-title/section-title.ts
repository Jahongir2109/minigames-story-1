import { ChangeDetectionStrategy, Component, input, type InputSignal } from '@angular/core';

/**
 * Section heading with the yellow accent bar; the heading text is projected, so a section can
 * add its own parts (e.g. a suffix hidden on mobile).
 */
@Component({
  selector: 'app-section-title',
  template: `
    <span class="section-title__accent" aria-hidden="true"></span>
    <h2 class="section-title__text" [id]="headingId()"><ng-content /></h2>
  `,
  styleUrl: './section-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTitle {
  /**
   * Id of the heading, used by the `aria-labelledby` of the section.
   */
  readonly headingId: InputSignal<string> = input.required<string>();
}
