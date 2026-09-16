import { Service } from '@angular/core';
import {
  SortDirection,
  User,
  UserDraft,
  UserFilter,
  UserPage,
  UserSort,
  UserSortField,
} from '../user.model';
import { SEED_USER_COUNT, idToIndex, indexToId, seedUser } from './user-seed';

export interface StoredUser {
  user: User;
  version: number;
}

/** The strong ETag for a stored user. The id keeps one user's ETag from matching another's. */
export function etagOf({ user, version }: StoredUser): string {
  return `"${user.id}.${version}"`;
}

/** Seed indices in ascending and descending order of one field, ids ascending among equal values. */
interface SeedOrders {
  asc: Int32Array;
  desc: Int32Array;
}

interface Keyed {
  index: number;
  key: string;
}

/**
 * The in-memory server's data. Seeded users are generated on read, and only users that were
 * created or updated are held in memory, so an unsorted page costs O(limit) at any offset.
 *
 * Sorting builds each field's seed order once (well under a second) and merges written users into
 * it on read. A filtered list scans every user in the requested order and keeps its matches until
 * the filter, the sort or the data changes.
 */
@Service()
export class UserStore {
  private readonly written = new Map<number, StoredUser>();
  private nextIndex = SEED_USER_COUNT;
  /** Bumped on every create and update, so a cached scan is rebuilt after a write. */
  private writes = 0;
  private readonly seedOrders = new Map<UserSortField, SeedOrders>();
  private lastScan: { key: string; matches: number[] } | undefined;

  get total(): number {
    return this.nextIndex;
  }

  /** A page of users, optionally sorted, and narrowed to those the filter keeps. */
  list(skip: number, limit: number, sort?: UserSort, filter?: UserFilter): UserPage {
    if (filter?.q || filter?.role || filter?.status) {
      const matches = this.scan(filter, sort);
      return {
        items: matches.slice(skip, skip + limit).map((index) => this.read(index).user),
        total: matches.length,
      };
    }

    const items: User[] = [];
    if (!sort || this.written.size === 0) {
      // Without writes the order is a plain array of indices, so a page is still O(limit).
      const order = sort ? this.seedOrder(sort) : undefined;
      const end = Math.min(skip + limit, this.nextIndex);
      for (let position = skip; position < end; position++) {
        items.push(this.read(order ? order[position] : position).user);
      }
    } else {
      let position = 0;
      for (const index of this.ordered(sort)) {
        if (position >= skip + limit) {
          break;
        }
        if (position++ >= skip) {
          items.push(this.read(index).user);
        }
      }
    }
    return { items, total: this.nextIndex };
  }

  get(id: string): StoredUser | undefined {
    const index = idToIndex(id);
    return index === null || index >= this.nextIndex ? undefined : this.read(index);
  }

  create(draft: UserDraft): StoredUser {
    const index = this.nextIndex++;
    const stored = { user: { id: indexToId(index), ...draft }, version: 1 };
    this.written.set(index, stored);
    this.writes++;
    return stored;
  }

  update(id: string, draft: UserDraft): StoredUser | undefined {
    const current = this.get(id);
    const index = idToIndex(id);
    if (!current || index === null) {
      return undefined;
    }
    const stored = { user: { id, ...draft }, version: current.version + 1 };
    this.written.set(index, stored);
    this.writes++;
    return stored;
  }

  private read(index: number): StoredUser {
    return this.written.get(index) ?? { user: seedUser(index), version: 1 };
  }

  private seedOrder({ field, direction }: UserSort): Int32Array {
    let orders = this.seedOrders.get(field);
    if (!orders) {
      orders = buildSeedOrders(field);
      this.seedOrders.set(field, orders);
    }
    return orders[direction];
  }

  /** Every user index in list order: the cached seed order with written users merged in. */
  private *ordered(sort?: UserSort): Generator<number> {
    if (!sort) {
      for (let index = 0; index < this.nextIndex; index++) {
        yield index;
      }
      return;
    }
    const compare = comparator(sort.direction);
    const written = Array.from(this.written, ([index, stored]) => ({
      index,
      key: keyOf(stored.user, sort.field),
    })).sort(compare);
    let next = 0;
    for (const index of this.seedOrder(sort)) {
      if (this.written.has(index)) {
        continue;
      }
      if (next < written.length) {
        const seed = { index, key: keyOf(seedUser(index), sort.field) };
        while (next < written.length && compare(written[next], seed) < 0) {
          yield written[next++].index;
        }
      }
      yield index;
    }
    while (next < written.length) {
      yield written[next++].index;
    }
  }

  /** The indices the filter keeps, in list order, cached until the data, sort or filter changes. */
  private scan({ q, role, status }: UserFilter, sort?: UserSort): number[] {
    const sortKey = sort ? `${sort.field}:${sort.direction}` : '';
    const key = `${this.writes}|${sortKey}|${q ?? ''}|${role ?? ''}|${status ?? ''}`;
    if (this.lastScan?.key !== key) {
      const needle = q?.toLowerCase();
      const matches: number[] = [];
      for (const index of this.ordered(sort)) {
        const user = this.read(index).user;
        // Role and status are equality checks, so they run before the two lower-cased text scans.
        if (role && user.role !== role) {
          continue;
        }
        if (status && user.status !== status) {
          continue;
        }
        if (
          needle &&
          !user.name.toLowerCase().includes(needle) &&
          !user.email.toLowerCase().includes(needle)
        ) {
          continue;
        }
        matches.push(index);
      }
      this.lastScan = { key, matches };
    }
    return this.lastScan.matches;
  }
}

function keyOf(user: User, field: UserSortField): string {
  return user[field].toLowerCase();
}

/** Orders by lower-cased value in `direction`, then by index ascending. */
function comparator(direction: SortDirection): (a: Keyed, b: Keyed) => number {
  return (a, b) => {
    if (a.key !== b.key) {
      const ascending = a.key < b.key ? -1 : 1;
      return direction === 'asc' ? ascending : -ascending;
    }
    return a.index - b.index;
  };
}

function buildSeedOrders(field: UserSortField): SeedOrders {
  const keys: string[] = new Array(SEED_USER_COUNT);
  for (let index = 0; index < SEED_USER_COUNT; index++) {
    keys[index] = keyOf(seedUser(index), field);
  }
  const asc = Int32Array.from({ length: SEED_USER_COUNT }, (_, index) => index);
  asc.sort((a, b) => (keys[a] < keys[b] ? -1 : keys[a] > keys[b] ? 1 : a - b));

  // Descending takes the runs of equal values in reverse, keeping ids ascending inside each run.
  const desc = new Int32Array(SEED_USER_COUNT);
  let written = 0;
  for (let end = SEED_USER_COUNT; end > 0;) {
    let start = end - 1;
    while (start > 0 && keys[asc[start - 1]] === keys[asc[start]]) {
      start--;
    }
    desc.set(asc.subarray(start, end), written);
    written += end - start;
    end = start;
  }
  return { asc, desc };
}
