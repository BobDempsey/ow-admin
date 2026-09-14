## 1. Models and errors

- [x] 1.1 Add `user.model.ts` with `User`, `UserDraft`, `UserPage`, `Versioned<T>`, `UserRole`/`UserStatus` unions and `USER_ROLES`/`USER_STATUSES`, and verify `ng build` passes
- [x] 1.2 Add `api-error.ts` with the `ApiError` class and the error body type, and verify `ng build` passes

## 2. In-memory store

- [x] 2.1 Implement `user-seed.ts` generating user `index` deterministically with id/index conversion, and verify tests show the same index yields the same user, ids round-trip, and role/status stay in their closed sets
- [x] 2.2 Implement `user-validation.ts` for draft/user payloads and `skip`/`limit`, and verify tests cover blank name, bad email, unknown role and status, negative skip, zero limit and non-integer values
- [x] 2.3 Implement `UserStore` (virtual seed of 500,000, overlay map, created array, versions) with `list`, `get`, `create`, `update`, and verify tests cover paging at offset 0, 50 and the last page, total after create, version bump on update and O(limit) paging at `skip=499,900`

## 3. Stubbed server

- [x] 3.1 Add `API_BASE_URL` and `API_LATENCY_MS` tokens and implement `inMemoryApiInterceptor` routing for all five endpoints with the status codes, headers and error body from design.md, and verify `ng build` passes
- [x] 3.2 Write interceptor tests through real `HttpClient` for every `user-api-client` scenario (default and explicit paging, limit cap, ETag on get, 201 with `Location` and ETag on create, matching and stale `If-Match`, 428, 204 reset, 400 field errors, 404 on each id endpoint, pass-through of non-API URLs) and verify they pass

## 4. Client service

- [x] 4.1 Implement `UsersApi` (`@Service`) with `list`, `get`, `create`, `update`, `resetPassword`, reading `ETag` from response headers and mapping failures to `ApiError`, and verify `ng build` passes
- [x] 4.2 Write `UsersApi` tests for each method's success shape, `ApiError` on 404, 412 and 400 with `fieldErrors`, and the "writes are visible to later reads" scenarios, and verify they pass

## 5. Wiring

- [x] 5.1 Add `provideUsersApi()` and register it in `app.config.ts`, and verify `ng build` and `ng test --watch=false` both pass with no test failures
