import './mobile-menu.scss';

import type { RouteName } from '@/app/router';
import closeIcon from '@/assets/icons/close.svg?raw';
import { createBrand } from '@/components/brand/brand';
import { createButton } from '@/components/ui/button/button';
import { markCurrentLinks, NAVIGATION_LINKS } from '@/shared/constants/navigation';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import { lockScroll, unlockScroll } from '@/shared/dom/scroll-lock';

export const MOBILE_MENU_ID: string = 'mobile-menu';

const DESKTOP_QUERY: string = '(min-width: 769px)';

export interface MobileMenuOptions {
  /**
   * The burger button: it receives `aria-expanded` and gets the focus back on close.
   */
  trigger: HTMLButtonElement;
  onLogin: () => void;
  onSignUp: () => void;
}

export interface MobileMenu {
  element: HTMLDialogElement;
  open: () => void;
  close: () => void;
  /**
   * Highlights the navigation link of the page that is open.
   */
  setCurrentRoute: (route: RouteName) => void;
}

function createLinks(anchors: HTMLAnchorElement[]): HTMLUListElement {
  const list: HTMLUListElement = createElement('ul', { className: 'mobile-menu__links' });

  for (const link of NAVIGATION_LINKS) {
    const anchor: HTMLAnchorElement = createElement('a', {
      className: 'mobile-menu__link',
      text: link.label,
      attributes: { href: link.href },
    });

    if (link.route !== undefined) {
      anchor.dataset.route = link.route;
    }

    anchors.push(anchor);
    list.append(createElement('li', { children: [anchor] }));
  }

  return list;
}

export function createMobileMenu(options: MobileMenuOptions): MobileMenu {
  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'mobile-menu__close',
    attributes: { type: 'button', 'aria-label': 'Close menu' },
    children: [createIcon(closeIcon, 'mobile-menu__close-icon')],
  });
  const loginButton: HTMLButtonElement = createButton({
    label: 'Log In',
    variant: 'outline-inverse',
    size: 'medium',
    className: 'mobile-menu__button',
  });
  const signUpButton: HTMLButtonElement = createButton({
    label: 'Sign Up',
    variant: 'primary',
    size: 'medium',
    className: 'mobile-menu__button',
  });

  const brand: HTMLAnchorElement = createBrand({ inverse: true });
  const top: HTMLElement = createElement('div', {
    className: 'mobile-menu__top',
    children: [brand, closeButton],
  });
  const anchors: HTMLAnchorElement[] = [];
  const navigation: HTMLElement = createElement('nav', {
    attributes: { 'aria-label': 'Mobile navigation' },
    children: [createLinks(anchors)],
  });
  const actions: HTMLElement = createElement('div', {
    className: 'mobile-menu__actions',
    children: [loginButton, signUpButton],
  });

  const element: HTMLDialogElement = createElement('dialog', {
    className: 'mobile-menu',
    attributes: { id: MOBILE_MENU_ID, 'aria-label': 'Site menu' },
    children: [top, navigation, actions],
  });

  const open = (): void => {
    if (element.open) {
      return;
    }

    element.showModal();
    lockScroll();
    options.trigger.setAttribute('aria-expanded', 'true');
  };

  const close = (): void => {
    element.close();
  };

  // Fires for every way of closing: button, Escape key, or programmatic close.
  element.addEventListener('close', (): void => {
    unlockScroll();
    options.trigger.setAttribute('aria-expanded', 'false');
  });

  closeButton.addEventListener('click', close);
  // Navigation happens in place, so the menu has to get out of the way of the new page.
  for (const anchor of [brand, ...anchors]) {
    anchor.addEventListener('click', close);
  }
  loginButton.addEventListener('click', (): void => {
    close();
    options.onLogin();
  });
  signUpButton.addEventListener('click', (): void => {
    close();
    options.onSignUp();
  });

  // The burger button is hidden on wide screens, so the menu must not stay open there.
  matchMedia(DESKTOP_QUERY).addEventListener('change', (event: MediaQueryListEvent): void => {
    if (event.matches) {
      close();
    }
  });

  const setCurrentRoute = (route: RouteName): void => {
    markCurrentLinks(anchors, route);
  };

  return { element, open, close, setCurrentRoute };
}
