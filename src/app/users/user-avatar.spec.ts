import {
  AVATAR_COLOR_CLASSES,
  AVATAR_COLOR_COUNT,
  avatarColorIndex,
  initialsOf,
} from './user-avatar';

describe('initialsOf', () => {
  it.each([
    ['Radia Lamport', 'RL'],
    ['Tim Berners Lee', 'TL'],
    ['Ada', 'A'],
    ['  grace   hopper  ', 'GH'],
    ['élodie Spärck', 'ÉS'],
    ['', ''],
  ])('turns %j into %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe('avatarColorIndex', () => {
  it('gives the same index for the same id every time', () => {
    expect(avatarColorIndex('u-000042')).toBe(avatarColorIndex('u-000042'));
  });

  it('stays in the range of the defined colors', () => {
    const indexes = Array.from({ length: 200 }, (_, n) =>
      avatarColorIndex(`u-${String(n).padStart(6, '0')}`),
    );

    expect(Math.min(...indexes)).toBe(0);
    expect(Math.max(...indexes)).toBe(AVATAR_COLOR_COUNT - 1);
    expect(AVATAR_COLOR_CLASSES).toHaveLength(AVATAR_COLOR_COUNT);
  });

  it('sums the character codes of the id', () => {
    // u 117, - 45, four 0s 192, 4 52, 2 50: 456, which is 0 modulo 6.
    expect(avatarColorIndex('u-000042')).toBe(0);
    expect(avatarColorIndex('u-000043')).toBe(1);
  });
});
