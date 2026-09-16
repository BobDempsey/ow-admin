/** How many avatar colors `styles.css` defines (`avatar-1` to `avatar-6`). */
export const AVATAR_COLOR_COUNT = 6;

/**
 * Complete class lists for each avatar color, so Tailwind finds every one. Indexed by
 * `avatarColorIndex`.
 */
export const AVATAR_COLOR_CLASSES: readonly string[] = [
  'bg-avatar-1-surface text-avatar-1-ink',
  'bg-avatar-2-surface text-avatar-2-ink',
  'bg-avatar-3-surface text-avatar-3-ink',
  'bg-avatar-4-surface text-avatar-4-ink',
  'bg-avatar-5-surface text-avatar-5-ink',
  'bg-avatar-6-surface text-avatar-6-ink',
];

/**
 * The first letter of a name's first and last words, in capitals, or one letter for a one-word
 * name. Letters are taken by code point, so an accented or astral first letter stays whole.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return '';
  }
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return `${first}${last}`.toLocaleUpperCase('en-US');
}

/** A color for a user that never changes, since it depends only on the user's id. */
export function avatarColorIndex(id: string): number {
  let sum = 0;
  for (let index = 0; index < id.length; index++) {
    sum += id.charCodeAt(index);
  }
  return sum % AVATAR_COLOR_COUNT;
}
