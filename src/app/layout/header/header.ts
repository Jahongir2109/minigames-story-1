import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { DialogUrl } from '@/core/dialogs/dialog-url';
import { CurrentPage, type PageName } from '@/core/navigation/current-page';
import { NAVIGATION_LINKS, type NavigationLink } from '@/core/navigation/links';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';

import { Brand } from '../brand/brand';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { MOBILE_MENU_ID, MobileMenu } from '../mobile-menu/mobile-menu';

export type AuthMode = 'login' | 'register';

/**
 * Site header: brand, main navigation (from tablet), the language dropdown and the Log In /
 * Sign Up actions; below the tablet width the burger opens the mobile menu.
 */
@Component({
  selector: 'app-header',
  imports: [Brand, Button, Icon, LanguageSwitcher, MobileMenu, RouterLink, TranslocoPipe],
  template: `
    <header class="header">
      <div class="header__inner">
        <app-brand />
        <div class="header__end">
          <nav class="header__nav" [attr.aria-label]="'nav.main' | transloco">
            <ul class="header__links">
              @for (link of links; track link.label) {
                <li>
                  <a
                    class="header__link"
                    [routerLink]="link.path"
                    [attr.aria-current]="isCurrent(link, currentPage.page()) ? 'page' : null"
                  >
                    {{ link.label | transloco }}
                  </a>
                </li>
              }
            </ul>
          </nav>
          <app-language-switcher />
          <div class="header__actions">
            <button
              class="header__login"
              type="button"
              appButton
              variant="outline"
              (click)="openAuth('login')"
            >
              {{ 'header.login' | transloco }}
            </button>
            <button class="header__signup" type="button" appButton (click)="openAuth('register')">
              {{ 'header.signUp' | transloco }}
            </button>
            <button
              class="header__burger"
              type="button"
              aria-haspopup="dialog"
              [attr.aria-label]="'header.openMenu' | transloco"
              [attr.aria-expanded]="menu.isOpen()"
              [attr.aria-controls]="menuId"
              (click)="menu.open()"
            >
              <app-icon class="header__burger-icon" name="burger" />
            </button>
          </div>
        </div>
      </div>
    </header>
    <app-mobile-menu #menu (login)="openAuth('login')" (signUp)="openAuth('register')" />
  `,
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly dialogs: DialogUrl = inject(DialogUrl);

  protected readonly currentPage: CurrentPage = inject(CurrentPage);
  protected readonly links: readonly NavigationLink[] = NAVIGATION_LINKS;
  protected readonly menuId: string = MOBILE_MENU_ID;

  protected isCurrent(link: NavigationLink, page: PageName | undefined): boolean {
    return link.page !== undefined && link.page === page;
  }

  /**
   * The Auth dialog follows the URL (`?auth=login`), so it can be linked and reopened with Back.
   */
  protected openAuth(mode: AuthMode): void {
    this.dialogs.open('auth', mode);
  }
}
