import { USER_ROLES, USER_STATUSES } from '../user.model';
import { idToIndex, indexToId, seedUser } from './user-seed';

describe('user seed', () => {
  it('builds the same user for the same index', () => {
    expect(seedUser(42)).toEqual(seedUser(42));
  });

  it('gives each index its own id and email', () => {
    const users = Array.from({ length: 1_000 }, (_, index) => seedUser(index));

    expect(new Set(users.map((user) => user.id)).size).toBe(users.length);
    expect(new Set(users.map((user) => user.email)).size).toBe(users.length);
  });

  it('produces plain ASCII email addresses', () => {
    for (let index = 0; index < 1_000; index++) {
      expect(seedUser(index).email).toMatch(/^[a-z-]+\.[a-z-]+\.\d+@example\.com$/);
    }
  });

  it('round-trips ids and indexes', () => {
    for (const index of [0, 1, 42, 499_999, 500_000, 1_234_567]) {
      expect(idToIndex(indexToId(index))).toBe(index);
    }
    expect(indexToId(42)).toBe('u-000042');
  });

  it('rejects ids that do not encode an index', () => {
    for (const id of ['', 'u-', 'u-42', 'x-000042', 'u-00004a', 'u-0000042', 'u-000042 ']) {
      expect(idToIndex(id)).toBeNull();
    }
  });

  it('keeps role and status inside their closed sets and uses every value', () => {
    const roles = new Set<string>();
    const statuses = new Set<string>();
    for (let index = 0; index < 1_000; index++) {
      const { role, status } = seedUser(index);
      expect(USER_ROLES).toContain(role);
      expect(USER_STATUSES).toContain(status);
      roles.add(role);
      statuses.add(status);
    }

    expect(roles.size).toBe(USER_ROLES.length);
    expect(statuses.size).toBe(USER_STATUSES.length);
  });
});
