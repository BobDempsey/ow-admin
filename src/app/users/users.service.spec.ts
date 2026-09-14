import { TestBed } from '@angular/core/testing';
import { API_LATENCY_MS } from '../core/api/api-config';
import { ApiError } from '../core/api/api-error';
import { seedUser } from '../core/api/in-memory/user-seed';
import { provideUsersApi } from '../core/api/provide-users-api';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
    });
    service = TestBed.inject(UsersService);
  });

  it('loads the first page and the total', async () => {
    const page = await service.loadPage({ skip: 0, limit: 25 });

    expect(page.total).toBe(500_000);
    expect(page.items).toHaveLength(25);
    expect(page.items[0].id).toBe(seedUser(0).id);
  });

  it('rejects with an ApiError when the request is invalid', async () => {
    await expect(service.loadPage({ skip: -1, limit: 25 })).rejects.toBeInstanceOf(ApiError);
  });
});
