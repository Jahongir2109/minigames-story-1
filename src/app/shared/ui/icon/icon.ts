import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type InputSignal,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { type IconName, ICONS } from './icons';

/**
 * A decorative inline SVG icon. Its size comes from the class the parent puts on it, the color
 * from the text color. Icons never carry meaning on their own: the control around them has the
 * accessible name.
 */
@Component({
  selector: 'app-icon',
  template: '',
  styleUrl: './icon.scss',
  // The SVG is inserted as HTML, so it has no scoping attribute: the styles stay global, but
  // every selector starts with the component tag.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[innerHTML]': 'markup()',
  },
})
export class Icon {
  private readonly sanitizer: DomSanitizer = inject(DomSanitizer);

  readonly name: InputSignal<IconName> = input.required<IconName>();

  // The markup comes from the bundled SVG files only, never from users or the API.
  protected readonly markup: Signal<SafeHtml> = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]),
  );
}
