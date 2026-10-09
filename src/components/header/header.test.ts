import { describe, expect, it, vi } from 'vitest';

import type { AppSession } from '@/auth/session';

import { createHeader, type Header, type HeaderOptions } from './header';

const SESSION: AppSession = {
  displayName: 'Cozy Gamer',
  email: 'cozy@minigames.com',
  authenticatedAt: 1,
};

function createOptions(): HeaderOptions {
  return { onLogin: vi.fn(), onSignUp: vi.fn(), onMenuOpen: vi.fn(), onLogout: vi.fn() };
}

function getButton(header: Header, selector: string): HTMLButtonElement {
  const button: HTMLButtonElement | null = header.element.querySelector(selector);

  if (button === null) {
    throw new Error(`No ${selector}`);
  }

  return button;
}

describe('createHeader', () => {
  it('opens the auth dialog and the menu from the guest actions', () => {
    const options: HeaderOptions = createOptions();
    const header: Header = createHeader(options);

    getButton(header, '.header__login').click();
    getButton(header, '.header__signup').click();
    header.menuButton.click();

    expect(options.onLogin).toHaveBeenCalledTimes(1);
    expect(options.onSignUp).toHaveBeenCalledTimes(1);
    expect(options.onMenuOpen).toHaveBeenCalledTimes(1);
  });

  it('marks the link of the current page', () => {
    const header: Header = createHeader(createOptions());

    header.setCurrentRoute('library');

    const current: HTMLAnchorElement[] = [
      ...header.element.querySelectorAll<HTMLAnchorElement>('.header__link'),
    ].filter((link: HTMLAnchorElement): boolean => link.ariaCurrent === 'page');

    expect(current.map((link: HTMLAnchorElement): string | null => link.textContent)).toEqual([
      'Library',
    ]);
  });

  it('replaces the guest actions with the profile while signed in', () => {
    const options: HeaderOptions = createOptions();
    const header: Header = createHeader(options);

    header.setSession(SESSION);

    expect(header.element.querySelector('.header__login')).toBeNull();
    expect(header.element.querySelector('.user-profile__name')?.textContent).toBe('Cozy Gamer');
    expect(header.element.querySelector('.user-avatar')?.textContent).toBe('CG');

    getButton(header, '.user-profile__logout').click();
    expect(options.onLogout).toHaveBeenCalledTimes(1);
  });

  it('restores the guest actions after logout', () => {
    const header: Header = createHeader(createOptions());

    header.setSession(SESSION);
    header.setSession(undefined);

    expect(header.element.querySelector('.user-profile')).toBeNull();
    expect(header.element.querySelector('.header__login')).not.toBeNull();
    expect(header.element.querySelector('.header__burger')).toBe(header.menuButton);
  });
});
