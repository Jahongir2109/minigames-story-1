import { describe, expect, it, type Mock, vi } from 'vitest';

import {
  AVATAR_RANDOM_COLORS,
  type AvatarColorPicker,
  createAvatarColorPicker,
  createCommentAvatar,
  getAvatarInitial,
} from './comment-avatar';

describe('createAvatarColorPicker', () => {
  it('picks one of the avatar-random tokens', () => {
    expect(createAvatarColorPicker((): number => 0)('A')).toBe('avatar-random-1');
    expect(createAvatarColorPicker((): number => 0.99)('A')).toBe('avatar-random-5');
    expect(createAvatarColorPicker((): number => 0.5)('A')).toBe('avatar-random-3');
  });

  it('keeps the color of a commenter across renders', () => {
    const random: Mock<() => number> = vi
      .fn<() => number>()
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);
    const pick: AvatarColorPicker = createAvatarColorPicker(random);

    expect(pick('ForestDweller')).toBe('avatar-random-1');
    expect(pick('CottageCoreMia')).toBe('avatar-random-5');
    expect(pick('ForestDweller')).toBe('avatar-random-1');
    expect(random).toHaveBeenCalledTimes(2);
  });

  it('uses Math.random by default', () => {
    const color: string = createAvatarColorPicker()('Alex');

    expect(AVATAR_RANDOM_COLORS).toContain(color);
  });
});

describe('getAvatarInitial', () => {
  it('is the first non-whitespace character in uppercase', () => {
    expect(getAvatarInitial('forestDweller')).toBe('F');
    expect(getAvatarInitial('  mia')).toBe('M');
    expect(getAvatarInitial('élodie')).toBe('É');
    expect(getAvatarInitial('_alex')).toBe('_');
  });

  it('keeps an emoji whole', () => {
    expect(getAvatarInitial('🍄 Fan')).toBe('🍄');
  });

  it('is empty for an empty name', () => {
    expect(getAvatarInitial(' '.repeat(3))).toBe('');
  });
});

describe('createCommentAvatar', () => {
  it('renders the initial on the token color', () => {
    const avatar: HTMLSpanElement = createCommentAvatar(' herbalTea', 'avatar-random-2');

    expect(avatar.textContent).toBe('H');
    expect(avatar.classList.contains('game-comments__avatar--avatar-random-2')).toBe(true);
    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });
});
