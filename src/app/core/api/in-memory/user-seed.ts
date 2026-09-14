import { User, UserRole, UserStatus } from '../user.model';

export const SEED_USER_COUNT = 500_000;

const ID_PREFIX = 'u-';
const ID_DIGITS = 6;
const ID_PATTERN = /^u-(\d+)$/;

const FIRST_NAMES = [
  'Ada',
  'Alan',
  'Barbara',
  'Claude',
  'Dennis',
  'Donald',
  'Edsger',
  'Frances',
  'Grace',
  'Hedy',
  'Ivan',
  'John',
  'Karen',
  'Katherine',
  'Ken',
  'Leslie',
  'Linus',
  'Margaret',
  'Niklaus',
  'Radia',
  'Shafi',
  'Tim',
  'Whitfield',
];

const LAST_NAMES = [
  'Allen',
  'Backus',
  'Berners-Lee',
  'Cerf',
  'Diffie',
  'Dijkstra',
  'Engelbart',
  'Hamilton',
  'Hopper',
  'Johnson',
  'Kay',
  'Knuth',
  'Lamarr',
  'Lamport',
  'Liskov',
  'Lovelace',
  'McCarthy',
  'Perlman',
  'Ritchie',
  'Shannon',
  'Sutherland',
  'Thompson',
  'Torvalds',
  'Turing',
  'Wirth',
  'Goldwasser',
  'Jones',
  'Spärck',
  'Hollerith',
];

export function indexToId(index: number): string {
  return ID_PREFIX + String(index).padStart(ID_DIGITS, '0');
}

/** Returns the index an id encodes, or `null` when the id is not one `indexToId` produces. */
export function idToIndex(id: string): number | null {
  const match = ID_PATTERN.exec(id);
  if (!match) {
    return null;
  }
  const index = Number(match[1]);
  return Number.isSafeInteger(index) && indexToId(index) === id ? index : null;
}

/** Builds seeded user `index` on demand, so the seed never has to exist in memory. */
export function seedUser(index: number): User {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return {
    id: indexToId(index),
    name: `${first} ${last}`,
    email: `${emailPart(first)}.${emailPart(last)}.${index}@example.com`,
    role: seedRole(index),
    status: seedStatus(index),
  };
}

function emailPart(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[^A-Za-z-]/g, '')
    .toLowerCase();
}

function seedRole(index: number): UserRole {
  if (index % 20 === 0) {
    return 'Admin';
  }
  return index % 5 === 0 ? 'Viewer' : 'Member';
}

function seedStatus(index: number): UserStatus {
  if (index % 11 === 0) {
    return 'suspended';
  }
  return index % 7 === 0 ? 'invited' : 'active';
}
