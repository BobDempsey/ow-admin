import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { API_LATENCY_MS } from './api-config';
import { ApiError } from './api-error';
import { seedUser } from './in-memory/user-seed';
import { provideUsersApi } from './provide-users-api';
import { UserDraft } from './user.model';
import { UsersApi } from './users-api';

const draft: UserDraft = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  role: 'Admin',
  status: 'invited',
};

async function apiFailure(request: Observable<unknown>): Promise<ApiError> {
  try {
    await firstValueFrom(request);
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected the request to fail.');
}

describe('UsersApi', () => {
  let api: UsersApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
    });
    api = TestBed.inject(UsersApi);
  });

  it('lists the default page', async () => {
    const page = await firstValueFrom(api.list());

    expect(page.total).toBe(500_000);
    expect(page.items).toHaveLength(25);
  });

  it('lists an explicit page', async () => {
    const page = await firstValueFrom(api.list({ skip: 50, limit: 10 }));

    expect(page.items.map((user) => user.id)).toEqual(
      Array.from({ length: 10 }, (_, offset) => seedUser(50 + offset).id),
    );
  });

  it('gets a user with its ETag', async () => {
    expect(await firstValueFrom(api.get('u-000042'))).toEqual({
      data: seedUser(42),
      etag: '"u-000042.1"',
    });
  });

  it('creates a user and returns its initial ETag', async () => {
    expect(await firstValueFrom(api.create(draft))).toEqual({
      data: { id: 'u-500000', ...draft },
      etag: '"u-500000.1"',
    });
  });

  it('updates a user with If-Match and returns the new ETag', async () => {
    const { etag } = await firstValueFrom(api.get('u-000042'));

    expect(await firstValueFrom(api.update('u-000042', draft, etag))).toEqual({
      data: { id: 'u-000042', ...draft },
      etag: '"u-000042.2"',
    });
  });

  it('resets a password', async () => {
    await expect(firstValueFrom(api.resetPassword('u-000042'))).resolves.toBeUndefined();
  });

  it('emits ApiError 404 for an unknown user on every id method', async () => {
    const errors = await Promise.all([
      apiFailure(api.get('u-999999')),
      apiFailure(api.update('u-999999', draft, '"u-999999.1"')),
      apiFailure(api.resetPassword('u-999999')),
    ]);

    expect(errors.map((error) => error.status)).toEqual([404, 404, 404]);
  });

  it('emits ApiError 412 for a stale ETag', async () => {
    const { etag } = await firstValueFrom(api.get('u-000042'));
    await firstValueFrom(api.update('u-000042', draft, etag));

    const error = await apiFailure(api.update('u-000042', { ...draft, name: 'Lost Update' }, etag));

    expect(error.status).toBe(412);
    expect(error.message).toEqual(expect.any(String));
  });

  it('emits ApiError 400 with field errors for an invalid user', async () => {
    const error = await apiFailure(api.create({ ...draft, email: 'not-an-email' }));

    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({ email: expect.any(String) });
  });

  it('emits ApiError 400 for an invalid page', async () => {
    const error = await apiFailure(api.list({ skip: -1 }));

    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({ skip: expect.any(String) });
  });

  it('lists a created user on the last page', async () => {
    const created = await firstValueFrom(api.create(draft));
    const page = await firstValueFrom(api.list({ skip: 500_000 }));

    expect(page.total).toBe(500_001);
    expect(page.items).toEqual([created.data]);
  });

  it('reads back an update with the ETag the update returned', async () => {
    const { etag } = await firstValueFrom(api.get('u-000042'));
    const updated = await firstValueFrom(api.update('u-000042', draft, etag));

    expect(await firstValueFrom(api.get('u-000042'))).toEqual(updated);
  });
});
