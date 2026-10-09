import { createElement } from '@/shared/dom/create-element';

/**
 * The `avatar-random` design tokens (see `_tokens.scss`).
 */
export const AVATAR_RANDOM_COLORS: readonly string[] = [
  'avatar-random-1',
  'avatar-random-2',
  'avatar-random-3',
  'avatar-random-4',
  'avatar-random-5',
];

/**
 * Returns the avatar color of a commenter.
 */
export type AvatarColorPicker = (authorName: string) => string;

/**
 * Picks a random `avatar-random` color for every commenter and keeps it while the comments are
 * mounted, so re-renders (e.g. after posting) do not change the colors. `random` returns a number
 * in [0, 1) like `Math.random`.
 */
export function createAvatarColorPicker(random: () => number = Math.random): AvatarColorPicker {
  const colors: Map<string, string> = new Map<string, string>();

  return (authorName: string): string => {
    const known: string | undefined = colors.get(authorName);

    if (known !== undefined) {
      return known;
    }

    const index: number = Math.floor(random() * AVATAR_RANDOM_COLORS.length);
    const color: string = AVATAR_RANDOM_COLORS[index] ?? 'avatar-random-1';

    colors.set(authorName, color);

    return color;
  };
}

/**
 * The first non-whitespace character of the name in uppercase (a whole emoji or symbol, too).
 */
export function getAvatarInitial(name: string): string {
  const [first = ''] = name.trim();

  return first.toLocaleUpperCase();
}

export function createCommentAvatar(authorName: string, color: string): HTMLSpanElement {
  return createElement('span', {
    className: `game-comments__avatar game-comments__avatar--${color}`,
    text: getAvatarInitial(authorName),
    attributes: { 'aria-hidden': 'true' },
  });
}
