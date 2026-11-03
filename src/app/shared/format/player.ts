const INITIALS_LENGTH: number = 2;

/**
 * Two-letter avatar label built from the capital letters of the nickname:
 * "Alex_Pro99" -> "AP", "MatchMaster" -> "MM".
 */
export function getInitials(nickname: string): string {
  const capitals: string[] = nickname.match(/[A-Z]/g) ?? [];

  return capitals.length >= INITIALS_LENGTH
    ? capitals.slice(0, INITIALS_LENGTH).join('')
    : nickname.slice(0, INITIALS_LENGTH).toUpperCase();
}
