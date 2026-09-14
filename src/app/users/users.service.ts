import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PageRequest, UserPage } from '../core/api/user.model';
import { UsersApi } from '../core/api/users-api';

/** The one place user screens reach the user API. */
@Service()
export class UsersService {
  private readonly api = inject(UsersApi);

  /** Loads one page of users. Rejects with an `ApiError` when the request fails. */
  loadPage(request: PageRequest): Promise<UserPage> {
    return firstValueFrom(this.api.list(request));
  }
}
