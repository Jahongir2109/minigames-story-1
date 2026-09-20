import './header.scss';

import burgerIcon from '@/assets/icons/burger.svg?raw';
import { createBrand } from '@/components/brand/brand';
import { createButton } from '@/components/ui/button/button';
import { NAVIGATION_LINKS } from '@/shared/constants/navigation';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

export interface HeaderOptions {
  onLogin: () => void;
  onSignUp: () => void;
  onMenuOpen: () => void;
}

export interface Header {
  element: HTMLElement;
  menuButton: HTMLButtonElement;
}

function createNavigation(): HTMLElement {
  const list: HTMLUListElement = createElement('ul', { className: 'header__links' });

  for (const link of NAVIGATION_LINKS) {
    const anchor: HTMLAnchorElement = createElement('a', {
      className: 'header__link',
      text: link.label,
      attributes: { href: link.href },
    });

    if (link.current) {
      anchor.setAttribute('aria-current', 'page');
    }

    list.append(createElement('li', { children: [anchor] }));
  }

  return createElement('nav', {
    className: 'header__nav',
    attributes: { 'aria-label': 'Main navigation' },
    children: [list],
  });
}

export function createHeader(options: HeaderOptions): Header {
  const loginButton: HTMLButtonElement = createButton({
    label: 'Log In',
    variant: 'outline',
    size: 'medium',
    className: 'header__login',
  });
  const signUpButton: HTMLButtonElement = createButton({
    label: 'Sign Up',
    variant: 'primary',
    size: 'medium',
    className: 'header__signup',
  });
  const menuButton: HTMLButtonElement = createElement('button', {
    className: 'header__burger',
    attributes: {
      type: 'button',
      'aria-label': 'Open menu',
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'aria-controls': 'mobile-menu',
    },
    children: [createIcon(burgerIcon, 'header__burger-icon')],
  });

  loginButton.addEventListener('click', options.onLogin);
  signUpButton.addEventListener('click', options.onSignUp);
  menuButton.addEventListener('click', options.onMenuOpen);

  const actions: HTMLElement = createElement('div', {
    className: 'header__actions',
    children: [loginButton, signUpButton, menuButton],
  });

  const end: HTMLElement = createElement('div', {
    className: 'header__end',
    children: [createNavigation(), actions],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'header__inner',
    children: [createBrand(), end],
  });
  const element: HTMLElement = createElement('header', {
    className: 'header',
    children: [inner],
  });

  return { element, menuButton };
}
