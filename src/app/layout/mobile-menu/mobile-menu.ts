import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  output,
  type OutputEmitterRef,
  type Signal,
  signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { CurrentPage, type PageName } from '@/core/navigation/current-page';
import { NAVIGATION_LINKS, type NavigationLink } from '@/core/navigation/links';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';
import { ScrollLock } from '@/shared/ui/scroll-lock';

import { Brand } from '../brand/brand';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

export const MOBILE_MENU_ID: string = 'mobile-menu';

// The burger button is hidden from this width on (mirrors `$bp-tablet`).
const DESKTOP_QUERY: string = '(min-width: 769px)';

/**
 * Full-screen navigation for tablet and mobile, rendered in the top layer by `<dialog>`.
 */
@Component({
  selector: 'app-mobile-menu',
  imports: [Brand, Button, Icon, LanguageSwitcher, RouterLink, TranslocoPipe],
  template: `
    <dialog
      #dialog
      class="mobile-menu"
      [id]="menuId"
      [attr.aria-label]="'menu.label' | transloco"
      (close)="onClosed()"
    >
      <div class="mobile-menu__top">
        <app-brand [inverse]="true" (click)="close()" />
        <button
          class="mobile-menu__close"
          type="button"
          [attr.aria-label]="'menu.close' | transloco"
          (click)="close()"
        >
          <app-icon class="mobile-menu__close-icon" name="close" />
        </button>
      </div>
      <nav [attr.aria-label]="'menu.navigation' | transloco">
        <ul class="mobile-menu__links">
          @for (link of links; track link.label) {
            <li>
              <a
                class="mobile-menu__link"
                [routerLink]="link.path"
                [attr.aria-current]="isCurrent(link, currentPage.page()) ? 'page' : null"
                (click)="close()"
              >
                {{ link.label | transloco }}
              </a>
            </li>
          }
        </ul>
      </nav>
      <app-language-switcher [inverse]="true" />
      <div class="mobile-menu__actions">
        <button
          class="mobile-menu__button"
          type="button"
          appButton
          variant="outline-inverse"
          (click)="choose(login)"
        >
          {{ 'header.login' | transloco }}
        </button>
        <button class="mobile-menu__button" type="button" appButton (click)="choose(signUp)">
          {{ 'header.signUp' | transloco }}
        </button>
      </div>
    </dialog>
  `,
  styleUrl: './mobile-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenu {
  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly scrollLock: ScrollLock = inject(ScrollLock);
  private readonly openState: WritableSignal<boolean> = signal(false);

  readonly login: OutputEmitterRef<void> = output();
  readonly signUp: OutputEmitterRef<void> = output();
  readonly isOpen: Signal<boolean> = this.openState.asReadonly();

  protected readonly currentPage: CurrentPage = inject(CurrentPage);
  protected readonly links: readonly NavigationLink[] = NAVIGATION_LINKS;
  protected readonly menuId: string = MOBILE_MENU_ID;

  constructor() {
    const query: MediaQueryList | undefined =
      inject(DOCUMENT).defaultView?.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent): void => {
      if (event.matches) {
        this.close();
      }
    };

    // The burger button is hidden on wide screens, so the menu must not stay open there.
    query?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => {
      query?.removeEventListener('change', onChange);
    });
  }

  open(): void {
    const dialog: HTMLDialogElement = this.dialog().nativeElement;

    if (dialog.open) {
      return;
    }

    dialog.showModal();
    this.scrollLock.lock();
    this.openState.set(true);
  }

  close(): void {
    const dialog: HTMLDialogElement = this.dialog().nativeElement;

    if (dialog.open) {
      dialog.close();
    }
  }

  protected isCurrent(link: NavigationLink, page: PageName | undefined): boolean {
    return link.page !== undefined && link.page === page;
  }

  // Every way of closing ends here: the button, Escape, a link or a programmatic close.
  protected onClosed(): void {
    this.scrollLock.unlock();
    this.openState.set(false);
  }

  // The menu gets out of the way before the requested dialog opens.
  protected choose(action: OutputEmitterRef<void>): void {
    this.close();
    action.emit();
  }
}
