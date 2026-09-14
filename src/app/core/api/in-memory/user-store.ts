import { Service } from '@angular/core';
import { User, UserDraft, UserPage } from '../user.model';
import { SEED_USER_COUNT, idToIndex, indexToId, seedUser } from './user-seed';

export interface StoredUser {
  user: User;
  version: number;
}

/** The strong ETag for a stored user. The id keeps one user's ETag from matching another's. */
export function etagOf({ user, version }: StoredUser): string {
  return `"${user.id}.${version}"`;
}

/**
 * The in-memory server's data. Seeded users are generated on read, and only users that were
 * created or updated are held in memory, so a page costs O(limit) at any offset.
 */
@Service()
export class UserStore {
  private readonly written = new Map<number, StoredUser>();
  private nextIndex = SEED_USER_COUNT;

  get total(): number {
    return this.nextIndex;
  }

  list(skip: number, limit: number): UserPage {
    const end = Math.min(skip + limit, this.nextIndex);
    const items: User[] = [];
    for (let index = skip; index < end; index++) {
      items.push(this.read(index).user);
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
    return stored;
  }

  private read(index: number): StoredUser {
    return this.written.get(index) ?? { user: seedUser(index), version: 1 };
  }
}
