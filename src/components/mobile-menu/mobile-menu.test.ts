import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppSession } from '@/auth/session';

import { createMobileMenu, type MobileMenu, type MobileMenuOptions } from './mobile-menu';

const SESSION: AppSession = {
  displayName: 'Cozy Gamer',
  email: 'cozy@minigames.com',
  authenticatedAt: 1,
};

function setup(): { menu: MobileMenu; options: MobileMenuOptions } {
  const options: MobileMenuOptions = {
    trigger: document.createElement('button'),
    onLogin: vi.fn(),
    onSignUp: vi.fn(),
    onLogout: vi.fn(),
  };
  const menu: MobileMenu = createMobileMenu(options);

  document.body.append(menu.element);

  return { menu, options };
}

function click(menu: MobileMenu, selector: string): void {
  menu.element.querySelector<HTMLElement>(selector)?.click();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createMobileMenu', () => {
  it('opens and closes and keeps the trigger state in sync', () => {
    const { menu, options } = setup();

    menu.open();
    expect(menu.element.open).toBe(true);
    expect(options.trigger.getAttribute('aria-expanded')).toBe('true');

    click(menu, '.mobile-menu__close');
    expect(menu.element.open).toBe(false);
    expect(options.trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes before it asks for the auth dialog', () => {
    const { menu, options } = setup();

    menu.open();
    click(menu, '.mobile-menu__button');

    expect(menu.element.open).toBe(false);
    expect(options.onLogin).toHaveBeenCalledTimes(1);

    menu.open();
    menu.element.querySelectorAll<HTMLButtonElement>('.mobile-menu__button')[1]?.click();
    expect(options.onSignUp).toHaveBeenCalledTimes(1);
  });

  it('closes when a navigation link is used', () => {
    const { menu } = setup();

    menu.open();
    menu.setCurrentRoute('home');
    click(menu, '.mobile-menu__link');

    expect(menu.element.open).toBe(false);
    expect(menu.element.querySelector<HTMLAnchorElement>('.mobile-menu__link')?.ariaCurrent).toBe(
      'page',
    );
  });

  it('shows the profile with a Logout action while signed in', () => {
    const { menu, options } = setup();

    menu.setSession(SESSION);
    menu.open();

    expect(menu.element.querySelector('.mobile-menu__button')).toBeNull();
    expect(menu.element.querySelector('.user-profile__name')?.textContent).toBe('Cozy Gamer');

    click(menu, '.user-profile__logout');

    expect(menu.element.open).toBe(false);
    expect(options.onLogout).toHaveBeenCalledTimes(1);
  });

  it('shows the guest actions again after logout', () => {
    const { menu } = setup();

    menu.setSession(SESSION);
    menu.setSession(undefined);

    expect(menu.element.querySelectorAll('.mobile-menu__button')).toHaveLength(2);
    expect(menu.element.querySelector('.user-profile')).toBeNull();
  });
});
