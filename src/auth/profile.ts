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
