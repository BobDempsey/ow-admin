import { UserDraft } from '../user.model';
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
});
