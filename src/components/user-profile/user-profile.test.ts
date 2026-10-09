import { describe, expect, it, vi } from 'vitest';

import type { AppSession } from '@/auth/session';

import { createUserAvatar, createUserProfile } from './user-profile';

const SESSION: AppSession = {
  displayName: 'Cozy Gamer',
  email: 'cozy@minigames.com',
  authenticatedAt: 1,
};

describe('createUserAvatar', () => {
  it('shows the initials without a photo', () => {
    const avatar: HTMLElement = createUserAvatar(SESSION);

    expect(avatar.textContent).toBe('CG');
    expect(avatar.querySelector('img')).toBeNull();
  });

  it('shows the photo when there is one', () => {
    const avatar: HTMLElement = createUserAvatar({ ...SESSION, avatarUrl: 'https://img/p.png' });

    expect(avatar.querySelector('img')?.getAttribute('src')).toBe('https://img/p.png');
  });

  it('falls back to the initials when the photo fails to load', () => {
    const avatar: HTMLElement = createUserAvatar({ ...SESSION, avatarUrl: 'https://img/broken' });

    avatar.querySelector('img')?.dispatchEvent(new Event('error'));

    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar.textContent).toBe('CG');
  });

  it('uses the email name and then a generic icon as fallbacks', () => {
    expect(createUserAvatar({ ...SESSION, displayName: '' }).textContent).toBe('C');
    expect(
      createUserAvatar({ ...SESSION, displayName: '!!!' }).querySelector('.user-avatar__icon'),
    ).not.toBeNull();
  });
});

describe('createUserProfile', () => {
  it('shows the name as text and logs out', () => {
    const onLogout: () => void = vi.fn();
    const profile: HTMLElement = createUserProfile({
      session: { ...SESSION, displayName: '<b>Hacker</b>' },
      variant: 'header',
      onLogout,
    });

    expect(profile.querySelector('.user-profile__name')?.textContent).toBe('<b>Hacker</b>');
    expect(profile.querySelector('b')).toBeNull();

    profile.querySelector<HTMLButtonElement>('.user-profile__logout')?.click();

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('marks the variant for the header and the menu styles', () => {
    expect(
      createUserProfile({ session: SESSION, variant: 'menu', onLogout: vi.fn() }).classList,
    ).toContain('user-profile--menu');
  });
});
