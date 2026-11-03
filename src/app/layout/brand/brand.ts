import { ChangeDetectionStrategy, Component, input, type InputSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { APP_NAME } from '@/core/i18n/translated-title.strategy';
import { HOME_PATH } from '@/core/navigation/links';
import { Icon } from '@/shared/ui/icon/icon';

/**
 * The logo and the app name, linking to Home.
 */
@Component({
  selector: 'app-brand',
  imports: [Icon, RouterLink, TranslocoPipe],
  template: `
    <a
      class="brand"
      [class.brand--inverse]="inverse()"
      [routerLink]="homePath"
      [attr.aria-label]="'brand.home' | transloco: { name: appName }"
    >
      <app-icon class="brand__logo" name="logo" />
      <span class="brand__name">{{ appName }}</span>
    </a>
  `,
  styleUrl: './brand.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Brand {
  /**
   * Light text for dark backgrounds (footer, mobile menu).
   */
  readonly inverse: InputSignal<boolean> = input<boolean>(false);

  protected readonly appName: string = APP_NAME;
  protected readonly homePath: string = HOME_PATH;
}
