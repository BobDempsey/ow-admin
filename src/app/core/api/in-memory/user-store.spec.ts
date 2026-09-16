import { User, UserDraft, UserSort } from '../user.model';
import { seedUser } from './user-seed';
import { UserStore, etagOf } from './user-store';

const draft: UserDraft = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  role: 'Admin',
  status: 'invited',
};

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore();
  });

  it('starts with 500,000 seeded users', () => {
    expect(store.total).toBe(500_000);
  });

  it('returns the first page', () => {
    const page = store.list(0, 25);

    expect(page.total).toBe(500_000);
    expect(page.items).toEqual(Array.from({ length: 25 }, (_, index) => seedUser(index)));
  });

  it('returns users at offsets 50 through 74', () => {
    const ids = store.list(50, 25).items.map((user) => user.id);

    expect(ids[0]).toBe('u-000050');
    expect(ids.at(-1)).toBe('u-000074');
    expect(ids).toHaveLength(25);
  });

  it('returns a short last page and an empty page past the end', () => {
    expect(store.list(499_990, 25).items).toHaveLength(10);
    expect(store.list(600_000, 25)).toEqual({ items: [], total: 500_000 });
  });

  it('pages near the end without building the seed', () => {
    const started = performance.now();
    const page = store.list(499_900, 100);
    const elapsed = performance.now() - started;

    expect(page.items[0].id).toBe('u-499900');
    expect(page.items.at(-1)?.id).toBe('u-499999');
    expect(elapsed).toBeLessThan(50);
  });

  it('finds seeded users by id and rejects unknown ids', () => {
    expect(store.get('u-000042')).toEqual({ user: seedUser(42), version: 1 });
    expect(store.get('u-500000')).toBeUndefined();
    expect(store.get('nope')).toBeUndefined();
  });

  it('creates users at the next index with version 1', () => {
    const created = store.create(draft);

    expect(created).toEqual({ user: { id: 'u-500000', ...draft }, version: 1 });
    expect(store.total).toBe(500_001);
    expect(store.get('u-500000')).toEqual(created);
    expect(store.list(500_000, 25)).toEqual({ items: [created.user], total: 500_001 });
  });

  it('updates a user and bumps its version on every write', () => {
    const first = store.update('u-000042', draft);
    const second = store.update('u-000042', { ...draft, status: 'active' });

    expect(first).toEqual({ user: { id: 'u-000042', ...draft }, version: 2 });
    expect(second?.version).toBe(3);
    expect(store.get('u-000042')).toEqual(second);
    expect(store.list(42, 1).items).toEqual([second?.user]);
  });

  it('does not update unknown users', () => {
    expect(store.update('u-600000', draft)).toBeUndefined();
    expect(store.total).toBe(500_000);
  });

  it('formats ETags from id and version', () => {
    expect(etagOf({ user: seedUser(42), version: 3 })).toBe('"u-000042.3"');
  });

  describe('sorted and searched lists', () => {
    const byName: UserSort = { field: 'name', direction: 'asc' };

    /** Fails unless users are in `sort` order, with ids ascending among equal values. */
    function expectInOrder(users: User[], { field, direction }: UserSort) {
      for (let position = 1; position < users.length; position++) {
        const [before, after] = [users[position - 1], users[position]];
        const [a, b] = [before[field].toLowerCase(), after[field].toLowerCase()];
        if (a === b) {
          expect(before.id < after.id, `${before.id} before ${after.id}`).toBe(true);
        } else {
          expect(direction === 'asc' ? a < b : a > b, `${a} before ${b}`).toBe(true);
        }
      }
    }

    it('sorts by name ascending with ids ascending among equal names', () => {
      const page = store.list(0, 100, byName);

      expect(page.total).toBe(500_000);
      expect(page.items[0].id).toBe('u-000000');
      expectInOrder(page.items, byName);
    });

    it('puts Viewers first by role descending, lowest ids first', () => {
      const ids = store.list(0, 5, { field: 'role', direction: 'desc' }).items.map((u) => u.id);

      expect(ids).toEqual(['u-000005', 'u-000010', 'u-000015', 'u-000025', 'u-000030']);
    });

    it('pages through a descending email sort without gaps or repeats', () => {
      const sort: UserSort = { field: 'email', direction: 'desc' };
      const users = [...store.list(0, 25, sort).items, ...store.list(25, 25, sort).items];

      expectInOrder(users, sort);
      expect(new Set(users.map((user) => user.id)).size).toBe(50);
    });

    it('sorts edited and created users by their current values', () => {
      store.update('u-000042', { ...draft, name: 'Aaron Aardvark' });
      const created = store.create({ ...draft, name: 'Zelda Quartermaine' });

      expect(store.list(0, 1, byName).items[0].id).toBe('u-000042');
      expect(store.list(0, 1, { field: 'name', direction: 'desc' }).items[0]).toEqual(created.user);
      const middle = store.list(250_000, 50, byName);
      expect(middle.total).toBe(500_001);
      expectInOrder(middle.items, byName);
      const ids = store.list(0, 100, byName).items.map((user) => user.id);
      expect(ids.filter((id) => id === 'u-000042')).toHaveLength(1);
    });

    it('finds users whose name or email contains the search, ignoring case', () => {
      const page = store.list(0, 25, undefined, { q: 'Lamport' });

      expect(page.total).toBe(17_241);
      for (const user of page.items) {
        expect(`${user.name} ${user.email}`.toLowerCase()).toContain('lamport');
      }
      expect(store.list(0, 25, undefined, { q: 'radia.lamport.42@' }).items).toEqual([
        seedUser(42),
      ]);
    });

    it('combines search, sort and skip', () => {
      const sort: UserSort = { field: 'email', direction: 'asc' };
      const expected = Array.from({ length: 500_000 }, (_, index) => seedUser(index))
        .filter((user) => `${user.name}\n${user.email}`.toLowerCase().includes('hopper'))
        .sort((a, b) =>
          a.email.toLowerCase() < b.email.toLowerCase()
            ? -1
            : a.email.toLowerCase() > b.email.toLowerCase()
              ? 1
              : a.id < b.id
                ? -1
                : 1,
        );

      const page = store.list(25, 25, sort, { q: 'hopper' });

      expect(page.total).toBe(expected.length);
      expect(page.items.map((user) => user.id)).toEqual(
        expected.slice(25, 50).map((user) => user.id),
      );
    });

    it('returns an empty page when nothing matches', () => {
      expect(store.list(0, 25, undefined, { q: 'no-such-user-xyz' })).toEqual({
        items: [],
        total: 0,
      });
    });

    it('rebuilds a cached search after a write', () => {
      expect(store.list(0, 25, undefined, { q: 'quartermaine' }).total).toBe(0);

      const created = store.create({ ...draft, name: 'Zelda Quartermaine' });

      expect(store.list(0, 25, undefined, { q: 'quartermaine' })).toEqual({
        items: [created.user],
        total: 1,
      });
    });

    it('keeps only users with the filtered role', () => {
      const page = store.list(0, 25, undefined, { role: 'Admin' });

      // Every twentieth seeded user is an Admin.
      expect(page.total).toBe(25_000);
      expect(page.items.map((user) => user.id)).toEqual(
        Array.from({ length: 25 }, (_, position) => seedUser(position * 20).id),
      );
    });

    it('keeps only users with both the filtered role and status', () => {
      const filter = { role: 'Viewer', status: 'suspended' } as const;
      let expected = 0;
      for (let index = 0; index < 500_000; index++) {
        const user = seedUser(index);
        if (user.role === filter.role && user.status === filter.status) {
          expected++;
        }
      }

      const page = store.list(0, 25, undefined, filter);

      expect(page.total).toBe(expected);
      for (const user of page.items) {
        expect([user.role, user.status]).toEqual(['Viewer', 'suspended']);
      }
    });

    it('combines a filter with a search and a sort across two pages', () => {
      const sort: UserSort = { field: 'name', direction: 'desc' };
      const filter = { q: 'hopper', status: 'active' } as const;
      const first = store.list(0, 25, sort, filter);
      const second = store.list(25, 25, sort, filter);
      const users = [...first.items, ...second.items];

      expect(second.total).toBe(first.total);
      expect(new Set(users.map((user) => user.id)).size).toBe(50);
      expectInOrder(users, sort);
      for (const user of users) {
        expect(user.status).toBe('active');
        expect(`${user.name} ${user.email}`.toLowerCase()).toContain('hopper');
      }
    });

    it('moves a created then updated user between status filters', () => {
      const created = store.create({ ...draft, name: 'Zelda Quartermaine', status: 'invited' });
      const updated = store.update(created.user.id, {
        ...draft,
        name: 'Zelda Quartermaine',
        status: 'suspended',
      });

      expect(store.list(0, 25, undefined, { q: 'quartermaine', status: 'suspended' })).toEqual({
        items: [updated?.user],
        total: 1,
      });
      expect(store.list(0, 25, undefined, { q: 'quartermaine', status: 'invited' })).toEqual({
        items: [],
        total: 0,
      });
    });
  });
});
