import { describe, expect, it } from 'vitest';

import {
  FALLBACK_PROFILE_NAME,
  getCommentAuthorName,
  getProfileInitials,
  getProfileName,
} from './profile';

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

describe('getCommentAuthorName', () => {
  it('uses the trimmed display name', () => {
    expect(getCommentAuthorName({ displayName: ' ForestDweller ', email: 'f@rs.school' })).toBe(
      'ForestDweller',
    );
  });

  it('falls back to the email local part when the display name is too short', () => {
    expect(getCommentAuthorName({ displayName: 'A', email: 'alex.pro@gmail.com' })).toBe(
      'alex.pro',
    );
    expect(getCommentAuthorName({ displayName: '', email: 'alex.pro@gmail.com' })).toBe('alex.pro');
  });

  it('shortens a long name to 30 characters', () => {
    const name: string = getCommentAuthorName({
      displayName: 'Maximilian Alexander von Habsburg',
      email: 'max@rs.school',
    });

    expect(name).toBe('Maximilian Alexander von Habsb');
    expect(name).toHaveLength(30);
  });

  it('does not end a shortened name with a space', () => {
    expect(
      getCommentAuthorName({ displayName: 'Abcdefghijklmnopqrstuvwxyzabc def', email: '' }),
    ).toBe('Abcdefghijklmnopqrstuvwxyzabc');
  });

  it('skips a name that becomes too short after shortening', () => {
    expect(
      getCommentAuthorName({ displayName: `A${' '.repeat(40)}B`, email: 'alex@rs.school' }),
    ).toBe('alex');
  });

  it('uses a generic name when nothing fits', () => {
    expect(getCommentAuthorName({ displayName: 'A', email: 'b@rs.school' })).toBe(
      FALLBACK_PROFILE_NAME,
    );
  });
});
