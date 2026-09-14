## Context

The workspace holds only the Angular 22 starter app: no HttpClient providers, no services, and one starter test. See proposal.md for why this layer comes first. The handoff's state decision puts a signal-based `UsersService` (holding ETags beside records, with `resource()` loading pages) in front of the screens; that service belongs to the UI tasks. This change builds the transport it will call.

## Goals / Non-Goals

**Goals:**
- Callers use Angular's real `HttpClient`, so request and response objects, headers, status codes and `HttpErrorResponse` are the genuine types a real backend would produce. Swapping in a real server means removing one interceptor.
- A page of users costs O(limit) regardless of `skip` or store size.
- Every scenario in `user-api-client` has a test.

**Non-Goals:**
- Email uniqueness. Checking it against 500,000 generated users needs an index this layer does not keep; it can be added later without changing the client.
- Persistence across page reloads. The store resets on reload.
- Sort, filter and search parameters (optional tasks that extend the contract).
- Delete. The contract has no delete endpoint.

## Decisions

### A functional interceptor plays the server

`inMemoryApiInterceptor` matches requests whose URL starts with the API base URL (`/api`, from an `API_BASE_URL` injection token), routes them by method and path, and returns a synthetic `HttpResponse` or throws an `HttpErrorResponse` without calling `next`. Anything else passes through to `next`. Angular's interceptor guide documents this pattern ("Synthetic responses").

Alternatives: a custom `HttpBackend` replaces the whole network stack, so it cannot coexist with a real API later and bypasses nothing useful. `angular-in-memory-web-api` adds a dependency the team would avoid and has no `If-Match`/`412` handling. Calling the store directly from services skips HTTP entirely, which the PDF rules out.

### Virtual seed plus a write overlay

`UserStore` never materialises the 500,000 seeded users. `seedUser(index)` builds user `index` deterministically from name lists (for example `u-000042`, `Ada Lovelace`, `ada.lovelace.42@example.com`, role and status cycling through their closed sets). IDs encode their index, so `GET /users/{id}` parses the id and needs no lookup table.

Writes go to a `Map<number, StoredUser>` overlay keyed by index, which holds both updated seeded users and created users. Created users take the next index (`u-500000`, `u-500001`, …), so ordering stays by index and new users land on the last page. `list(skip, limit)` walks indexes `skip` to `skip + limit - 1`, reading the overlay first and generating otherwise.

Alternative: generate all 500,000 objects at startup. That costs roughly 100 MB and a noticeable pause, and hides exactly the scale problem the exercise asks about.

### ETags are record versions

Each stored user carries a `version`, starting at 1 for seeded and created users and incrementing on every successful `PUT`. The ETag is the strong validator `"<id>.<version>"`. Including the id keeps an ETag from one user matching another's. `If-Match` is compared as an exact string; `*` is not supported.

### Status codes and error body

Success codes follow the delta spec. Errors return `HttpErrorResponse` with a JSON body `{ status, error, message, fieldErrors? }`, where `fieldErrors` maps a field name to its message. Codes: `400` validation, `404` unknown id or route, `412` stale `If-Match`, `428` missing `If-Match`, `405` wrong method on a known path.

### Typed client with one error type

`UsersApi` (a `@Service`) wraps `HttpClient`:

- `list({ skip?, limit? }): Observable<UserPage>`
- `get(id): Observable<Versioned<User>>`
- `create(draft): Observable<Versioned<User>>`
- `update(id, user, etag): Observable<Versioned<User>>`
- `resetPassword(id): Observable<void>`

`Versioned<T>` is `{ data: T; etag: string }`, read from the `ETag` response header via `observe: 'response'`. Every method maps `HttpErrorResponse` to an `ApiError` class carrying `status`, `message` and `fieldErrors`, so callers branch on `error.status === 412` without touching HTTP types. Errors travel down the Observable's error channel; nothing throws synchronously.

Models live in `user.model.ts`: `User`, `UserDraft` (no `id`), `UserRole` and `UserStatus` as string-literal unions with matching `USER_ROLES` and `USER_STATUSES` arrays that validation and later form selects share.

### Simulated latency

The interceptor delays each response by a value from a `API_LATENCY_MS` token (default 250 ms in the app, 0 in tests). Responses must arrive asynchronously for loading states in the UI to be exercised at all.

### Wiring and layout

`provideUsersApi()` returns `provideHttpClient(withFetch(), withInterceptors([inMemoryApiInterceptor]))` and is added to `app.config.ts`.

```
src/app/core/api/
  user.model.ts
  api-config.ts                (API_BASE_URL, API_LATENCY_MS)
  api-error.ts                 (+ .spec.ts)
  users-api.ts                 (+ .spec.ts)
  provide-users-api.ts
  in-memory/
    user-seed.ts               (+ .spec.ts)
    user-store.ts              (+ .spec.ts)
    user-validation.ts         (+ .spec.ts)
    in-memory-api.interceptor.ts (+ .spec.ts)
```

### Tests

Vitest through `ng test`. Store, seed and validation tests are plain unit tests. Interceptor and `UsersApi` tests use `TestBed` with `provideUsersApi()` and `API_LATENCY_MS` set to 0, drive requests through the real `HttpClient`, and await results with `firstValueFrom`. The interceptor spec adds `provideHttpClientTesting`, which replaces only the network backend: interceptors still run, pass-through requests can be flushed, and `verify()` proves no API request reached the network.

## Risks / Trade-offs

- [The store is a root singleton, so state leaks between tests] → `UserStore` is provided through `TestBed` per test, which gives each test a fresh instance.
- [Seeded data looks repetitive at 500,000 rows] → Names repeat, but the index in each email keeps every email distinct; realism beyond that does not change behaviour.
- [A real server might order or page differently] → The contract only specifies `skip`/`limit`; ordering by index is recorded here and in tests, so a change later is visible.
- [250 ms latency slows manual testing] → The token can be set to 0 in `app.config.ts`.
