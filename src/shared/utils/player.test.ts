import { describe, expect, it } from 'vitest';

import { getInitials } from './player';

describe('getInitials', () => {
  it('takes the first two capital letters of the nickname', () => {
    expect(getInitials('Alex_Pro99')).toBe('AP');
    expect(getInitials('MatchMaster')).toBe('MM');
    expect(getInitials('BigRedDog')).toBe('BR');
  });

  it('falls back to the first two characters when there are fewer capitals', () => {
    expect(getInitials('Zed')).toBe('ZE');
    expect(getInitials('gamer')).toBe('GA');
  });
});
