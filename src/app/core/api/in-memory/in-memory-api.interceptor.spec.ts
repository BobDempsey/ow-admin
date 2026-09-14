import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { API_LATENCY_MS } from '../api-config';
import { provideUsersApi } from '../provide-users-api';
import { User, UserDraft, UserPage } from '../user.model';
import { seedUser } from './user-seed';

const draft: UserDraft = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  role: 'Admin',
  status: 'invited',
};

async function failure(request: Observable<unknown>): Promise<HttpErrorResponse> {
  try {
    await firstValueFrom(request);
  } catch (error) {
    if (error instanceof HttpErrorResponse) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected the request to fail.');
}

describe('inMemoryApiInterceptor', () => {
  let http: HttpClient;
  let network: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideUsersApi(),
        provideHttpClientTesting(),
        { provide: API_LATENCY_MS, useValue: 0 },
      ],
    });
    http = TestBed.inject(HttpClient);
    network = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    network.verify();
  });

  const getUser = (id: string) =>
    firstValueFrom(http.get<User>(`/api/users/${id}`, { observe: 'response' }));

  const putUser = (id: string, body: unknown, ifMatch?: string) =>
    http.put<User>(`/api/users/${id}`, body, {
      observe: 'response',
      headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
    });

  describe('GET /users', () => {
    it('returns 25 users from offset 0 by default, with the full total', async () => {
      const response = await firstValueFrom(
        http.get<UserPage>('/api/users', { observe: 'response' }),
      );

      expect(response.status).toBe(200);
      expect(response.body?.total).toBe(500_000);
      expect(response.body?.items).toHaveLength(25);
      expect(response.body?.items[0]).toEqual(seedUser(0));
    });

    it('returns the users at offsets 50 through 74 for skip=50&limit=25', async () => {
      const fromParams = await firstValueFrom(
        http.get<UserPage>('/api/users', { params: { skip: 50, limit: 25 } }),
      );
      const fromUrl = await firstValueFrom(http.get<UserPage>('/api/users?skip=50&limit=25'));

      expect(fromParams.items.map((user) => user.id)).toEqual(
        Array.from({ length: 25 }, (_, offset) => seedUser(50 + offset).id),
      );
      expect(fromParams.total).toBe(500_000);
      expect(fromUrl).toEqual(fromParams);
    });

    it('caps limit at 100', async () => {
      const page = await firstValueFrom(http.get<UserPage>('/api/users?limit=500'));

      expect(page.items).toHaveLength(100);
    });

    it('rejects a negative skip with 400', async () => {
      const error = await failure(http.get('/api/users?skip=-1'));

      expect(error.status).toBe(400);
      expect(error.error.fieldErrors).toEqual({ skip: expect.any(String) });
    });

    it('rejects a zero limit with 400', async () => {
      const error = await failure(http.get('/api/users?limit=0'));

      expect(error.status).toBe(400);
      expect(error.error.fieldErrors).toEqual({ limit: expect.any(String) });
    });
  });

  describe('GET /users/{id}', () => {
    it('returns the user with an ETag', async () => {
      const response = await getUser('u-000042');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(seedUser(42));
      expect(response.headers.get('ETag')).toBe('"u-000042.1"');
    });

    it('returns a structured 404 for an unknown id', async () => {
      const error = await failure(http.get('/api/users/u-999999'));

      expect(error.status).toBe(404);
      expect(error.error).toEqual({ status: 404, error: 'Not Found', message: expect.any(String) });
    });

    it('gives the caller its own copy of the user', async () => {
      const first = await getUser('u-000042');
      if (first.body) {
        first.body.name = 'Changed by the caller';
      }

      expect((await getUser('u-000042')).body).toEqual(seedUser(42));
    });
  });

  describe('POST /users', () => {
    it('creates the user and returns 201 with ETag and Location', async () => {
      const response = await firstValueFrom(
        http.post<User>('/api/users', draft, { observe: 'response' }),
      );

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 'u-500000', ...draft });
      expect(response.headers.get('ETag')).toBe('"u-500000.1"');
      expect(response.headers.get('Location')).toBe('/api/users/u-500000');
    });

    it('lists the created user on the last page and counts it in total', async () => {
      await firstValueFrom(http.post('/api/users', draft));
      const page = await firstValueFrom(http.get<UserPage>('/api/users?skip=499990'));

      expect(page.total).toBe(500_001);
      expect(page.items.at(-1)).toEqual({ id: 'u-500000', ...draft });
    });

    it('rejects invalid fields with 400 and creates nothing', async () => {
      const error = await failure(
        http.post('/api/users', { ...draft, name: ' ', email: 'not-an-email' }),
      );
      const page = await firstValueFrom(http.get<UserPage>('/api/users'));

      expect(error.status).toBe(400);
      expect(error.error.fieldErrors).toEqual({
        name: expect.any(String),
        email: expect.any(String),
      });
      expect(page.total).toBe(500_000);
    });
  });

  describe('PUT /users/{id}', () => {
    it('applies the update when If-Match matches and returns a new ETag', async () => {
      const response = await firstValueFrom(putUser('u-000042', draft, '"u-000042.1"'));
      const readBack = await getUser('u-000042');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'u-000042', ...draft });
      expect(response.headers.get('ETag')).toBe('"u-000042.2"');
      expect(readBack.body).toEqual({ id: 'u-000042', ...draft });
      expect(readBack.headers.get('ETag')).toBe('"u-000042.2"');
    });

    it('returns 412 for a stale If-Match and leaves the user unchanged', async () => {
      await firstValueFrom(putUser('u-000042', draft, '"u-000042.1"'));
      const error = await failure(
        putUser('u-000042', { ...draft, name: 'Lost Update' }, '"u-000042.1"'),
      );
      const readBack = await getUser('u-000042');

      expect(error.status).toBe(412);
      expect(readBack.body?.name).toBe(draft.name);
      expect(readBack.headers.get('ETag')).toBe('"u-000042.2"');
    });

    it('returns 428 without If-Match and leaves the user unchanged', async () => {
      const error = await failure(putUser('u-000042', draft));
      const readBack = await getUser('u-000042');

      expect(error.status).toBe(428);
      expect(readBack.body).toEqual(seedUser(42));
      expect(readBack.headers.get('ETag')).toBe('"u-000042.1"');
    });

    it('returns 400 for an unknown role and leaves the user unchanged', async () => {
      const error = await failure(putUser('u-000042', { ...draft, role: 'Owner' }, '"u-000042.1"'));
      const readBack = await getUser('u-000042');

      expect(error.status).toBe(400);
      expect(error.error.fieldErrors).toEqual({ role: expect.any(String) });
      expect(readBack.body).toEqual(seedUser(42));
      expect(readBack.headers.get('ETag')).toBe('"u-000042.1"');
    });

    it('returns 400 when the body tries to change the id', async () => {
      const error = await failure(
        putUser('u-000042', { ...draft, id: 'u-000043' }, '"u-000042.1"'),
      );

      expect(error.status).toBe(400);
      expect(error.error.fieldErrors).toEqual({ id: expect.any(String) });
      expect((await getUser('u-000042')).body).toEqual(seedUser(42));
    });
  });

  describe('POST /users/{id}/password-reset', () => {
    it('returns 204 with an empty body and needs no If-Match', async () => {
      const response = await firstValueFrom(
        http.post('/api/users/u-000042/password-reset', null, { observe: 'response' }),
      );

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe('errors', () => {
    it('returns 404 from every id endpoint for an unknown user', async () => {
      const errors = await Promise.all([
        failure(http.get('/api/users/u-999999')),
        failure(putUser('u-999999', draft, '"u-999999.1"')),
        failure(http.post('/api/users/u-999999/password-reset', null)),
      ]);

      expect(errors.map((error) => error.status)).toEqual([404, 404, 404]);
      for (const error of errors) {
        expect(error.error.message).toEqual(expect.any(String));
      }
    });

    it('returns 405 with an Allow header for an unsupported method', async () => {
      const error = await failure(http.delete('/api/users/u-000042'));

      expect(error.status).toBe(405);
      expect(error.headers.get('Allow')).toBe('GET, PUT');
    });

    it('returns 404 for an unknown route', async () => {
      const error = await failure(http.get('/api/groups'));

      expect(error.status).toBe(404);
    });
  });

  describe('pass-through', () => {
    it('sends requests outside the API base URL to the network', async () => {
      const assets = firstValueFrom(http.get('/assets/config.json'));
      const lookalike = firstValueFrom(http.get('/apiary'));
      network.expectOne('/assets/config.json').flush({ source: 'assets' });
      network.expectOne('/apiary').flush({ source: 'apiary' });

      expect(await assets).toEqual({ source: 'assets' });
      expect(await lookalike).toEqual({ source: 'apiary' });
    });
  });
});

describe('inMemoryApiInterceptor latency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideUsersApi()] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers after the default 250 ms delay', () => {
    const http = TestBed.inject(HttpClient);
    let response: HttpResponse<unknown> | undefined;

    http
      .get('/api/users/u-000001', { observe: 'response' })
      .subscribe((value) => (response = value));
    vi.advanceTimersByTime(249);
    expect(response).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(response?.body).toEqual(seedUser(1));
  });
});
