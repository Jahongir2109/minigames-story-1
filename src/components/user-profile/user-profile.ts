import './user-profile.scss';

import userIcon from '@/assets/icons/user.svg?raw';
import { getProfileInitials, getProfileName } from '@/auth/profile';
import type { AppSession } from '@/auth/session';
import { createButton } from '@/components/ui/button/button';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

export type UserProfileVariant = 'header' | 'menu';

export interface UserProfileOptions {
  session: AppSession;
  variant: UserProfileVariant;
  onLogout: () => void;
}

// Initials, or a generic person icon when the name has no letters or digits.
function createInitials(name: string): Element {
  const initials: string = getProfileInitials(name);

  return initials === ''
    ? createIcon(userIcon, 'user-avatar__icon')
    : createElement('span', { className: 'user-avatar__initials', text: initials });
}

/**
 * The avatar of the signed-in user: the profile photo, or the initials when there is no photo or
 * it fails to load.
 */
export function createUserAvatar(session: AppSession, className: string = ''): HTMLElement {
  const name: string = getProfileName(session);
  const avatar: HTMLElement = createElement('span', {
    className: `user-avatar ${className}`.trim(),
    attributes: { 'aria-hidden': 'true' },
  });

  if (session.avatarUrl === undefined) {
    avatar.append(createInitials(name));

    return avatar;
  }

  const image: HTMLImageElement = createElement('img', {
    className: 'user-avatar__image',
    attributes: { src: session.avatarUrl, alt: '', referrerpolicy: 'no-referrer' },
  });

  image.addEventListener('error', (): void => {
    image.replaceWith(createInitials(name));
  });
  avatar.append(image);

  return avatar;
}

/**
 * The signed-in state of the header and the mobile menu: avatar, name and the Logout action.
 */
export function createUserProfile(options: UserProfileOptions): HTMLElement {
  const name: string = getProfileName(options.session);
  const logout: HTMLButtonElement = createButton({
    label: 'Log Out',
    variant: options.variant === 'menu' ? 'outline-inverse' : 'outline',
    size: 'medium',
    className: 'user-profile__logout',
  });

  logout.addEventListener('click', options.onLogout);

  return createElement('div', {
    className: `user-profile user-profile--${options.variant}`,
    children: [
      createUserAvatar(options.session, 'user-profile__avatar'),
      // The name is user input: it is always set as text, never as HTML.
      createElement('span', {
        className: 'user-profile__name',
        text: name,
        attributes: { title: name },
      }),
      logout,
    ],
  });
}
