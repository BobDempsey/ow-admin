import { Service, inject } from '@angular/core';
import { firstValueFrom, switchMap } from 'rxjs';
import {
  PageRequest,
  USER_STATUSES,
  User,
  UserDraft,
  UserPage,
  Versioned,
} from '../core/api/user.model';
import { UsersApi } from '../core/api/users-api';

/**
 * The one place user screens reach the user API. It holds no state: callers keep each user
 * together with the ETag it was read with. Every method rejects with an `ApiError` on failure.
 */
@Service()
export class UsersService {
  private readonly api = inject(UsersApi);

  /** Loads one page of users. */
  loadPage(request: PageRequest): Promise<UserPage> {
    return firstValueFrom(this.api.list(request));
  }

  /** Loads one user with its current ETag. */
  loadUser(id: string): Promise<Versioned<User>> {
    return firstValueFrom(this.api.get(id));
  }

  /** Creates a user and returns it with its initial ETag. */
  createUser(draft: UserDraft): Promise<Versioned<User>> {
    return firstValueFrom(this.api.create(draft));
  }

  /** Saves a user. `etag` is the ETag of the caller's last read; a stale one rejects with 412. */
  saveUser(id: string, draft: UserDraft, etag: string): Promise<Versioned<User>> {
    return firstValueFrom(this.api.update(id, draft, etag));
  }

  /**
   * Changes the user the way a second admin would: reads it, then saves it with its status moved
   * to the next value. The new ETag is not returned, so ETags callers hold for this user go stale.
   */
  async simulateConcurrentEdit(id: string): Promise<void> {
    await firstValueFrom(
      this.api
        .get(id)
        .pipe(
          switchMap(({ data: { id: _id, ...draft }, etag }) =>
            this.api.update(id, { ...draft, status: nextStatus(draft.status) }, etag),
          ),
        ),
    );
  }
}

function nextStatus(status: UserDraft['status']): UserDraft['status'] {
  return USER_STATUSES[(USER_STATUSES.indexOf(status) + 1) % USER_STATUSES.length];
}
