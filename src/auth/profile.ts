import type { UserProfile } from './session';

export const FALLBACK_PROFILE_NAME: string = 'Player';

const INITIALS_WORDS: number = 2;
// The first letter or digit of a word, in any script.
const ALPHANUMERIC_PATTERN: RegExp = /[\p{L}\p{N}]/u;

/**
 * The name shown for the signed-in user: the display name, else the part of the email before `@`,
 * else a generic name.
 */
export function getProfileName(profile: Pick<UserProfile, 'displayName' | 'email'>): string {
  const displayName: string = profile.displayName.trim();

  if (displayName !== '') {
    return displayName;
  }

  const localPart: string = profile.email.split('@', 1)[0]?.trim() ?? '';

  return localPart === '' ? FALLBACK_PROFILE_NAME : localPart;
}

export const AUTHOR_NAME_MIN_LENGTH: number = 2;
export const AUTHOR_NAME_MAX_LENGTH: number = 30;

/**
 * The comment author name accepted by the API (2–30 characters): the display name, else the part
 * of the email before `@` (a Google profile may have neither in range), else a generic name. A
 * longer name is shortened.
 */
export function getCommentAuthorName(profile: Pick<UserProfile, 'displayName' | 'email'>): string {
  const candidates: readonly string[] = [
    profile.displayName.trim(),
    profile.email.split('@', 1)[0]?.trim() ?? '',
  ];
  const name: string | undefined = candidates.find(
    (candidate: string): boolean => candidate.length >= AUTHOR_NAME_MIN_LENGTH,
  );

  return name === undefined
    ? FALLBACK_PROFILE_NAME
    : name.slice(0, AUTHOR_NAME_MAX_LENGTH).trimEnd();
}

/**
 * Avatar initials: the first letter or digit of the first word, or of each of the first two words.
 * Empty when the name has no letters or digits (a generic avatar is shown then).
 */
export function getProfileInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word: string): string => ALPHANUMERIC_PATTERN.exec(word)?.[0] ?? '')
    .filter((initial: string): boolean => initial !== '')
    .slice(0, INITIALS_WORDS)
    .join('')
    .toLocaleUpperCase();
}
