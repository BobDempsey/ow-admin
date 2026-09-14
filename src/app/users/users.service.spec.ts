import { TestBed } from '@angular/core/testing';
import { API_LATENCY_MS } from '../core/api/api-config';
import { ApiError } from '../core/api/api-error';
import { seedUser } from '../core/api/in-memory/user-seed';
import { provideUsersApi } from '../core/api/provide-users-api';
import { UserDraft } from '../core/api/user.model';
import { UsersService } from './users.service';

const draft: UserDraft = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  role: 'Admin',
  status: 'invited',
};

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

  it('loads a user with its ETag', async () => {
    const { data, etag } = await service.loadUser('u-000042');

    expect(data).toEqual(seedUser(42));
    expect(etag).toBe('"u-000042.1"');
  });

  it('creates a user and returns its id and ETag', async () => {
    const { data, etag } = await service.createUser(draft);

    expect(data).toEqual({ id: 'u-500000', ...draft });
    expect(etag).toBe('"u-500000.1"');
  });

  it('saves with the held ETag, returns a new one, and rejects a stale one with 412', async () => {
    const loaded = await service.loadUser('u-000042');

    const saved = await service.saveUser('u-000042', draft, loaded.etag);
    expect(saved.data).toEqual({ id: 'u-000042', ...draft });
    expect(saved.etag).toBe('"u-000042.2"');

    const stale = service.saveUser('u-000042', draft, loaded.etag);
    await expect(stale).rejects.toBeInstanceOf(ApiError);
    await expect(stale).rejects.toMatchObject({ status: 412 });
  });

  it('simulates a concurrent edit that moves the status on and stales held ETags', async () => {
    const loaded = await service.createUser(draft);

    await service.simulateConcurrentEdit(loaded.data.id);

    const current = await service.loadUser(loaded.data.id);
    expect(current.data).toEqual({ ...loaded.data, status: 'suspended' });
    await expect(service.saveUser(loaded.data.id, draft, loaded.etag)).rejects.toMatchObject({
      status: 412,
    });
  });
});
