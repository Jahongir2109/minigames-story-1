import { describe, expect, it } from 'vitest';

import { FALLBACK_PROFILE_NAME, getProfileInitials, getProfileName } from './profile';

describe('getProfileName', () => {
  it('prefers the trimmed display name', () => {
    expect(getProfileName({ displayName: '  Cozy Gamer ', email: 'cozy@minigames.com' })).toBe(
      'Cozy Gamer',
    );
  });

  it('falls back to the part of the email before @', () => {
    expect(getProfileName({ displayName: ' ', email: 'alex.pro@gmail.com' })).toBe('alex.pro');
  });

  it('uses a generic name when nothing is available', () => {
    expect(getProfileName({ displayName: '', email: '' })).toBe(FALLBACK_PROFILE_NAME);
    expect(getProfileName({ displayName: '', email: '@gmail.com' })).toBe(FALLBACK_PROFILE_NAME);
  });
});

describe('getProfileInitials', () => {
  it('takes one character for one word', () => {
    expect(getProfileInitials('cozy')).toBe('C');
    expect(getProfileInitials('  CozyGamer99 ')).toBe('C');
  });

  it('takes the first two words for longer names', () => {
    expect(getProfileInitials('alex pro gamer')).toBe('AP');
    expect(getProfileInitials('Alex   Pro')).toBe('AP');
  });

  it('skips leading symbols inside a word and words without letters or digits', () => {
    expect(getProfileInitials('_alex (pro)')).toBe('AP');
    expect(getProfileInitials('alex -- pro')).toBe('AP');
    expect(getProfileInitials('42 lives')).toBe('4L');
  });

  it('supports letters of any script', () => {
    expect(getProfileInitials('жасур алиев')).toBe('ЖА');
    expect(getProfileInitials('élodie')).toBe('É');
    expect(getProfileInitials('Ōtani Shohei')).toBe('ŌS');
  });

  it('is empty when there is no letter or digit', () => {
    expect(getProfileInitials('')).toBe('');
    expect(getProfileInitials('  ')).toBe('');
    expect(getProfileInitials('--- !!!')).toBe('');
  });
});
