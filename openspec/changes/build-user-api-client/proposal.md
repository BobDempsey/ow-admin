## Why

Every screen still to build (user list, create, view and edit) reads and writes through the client-side API layer, and none of it exists yet. The `user-api-client` spec also leaves gaps a real HTTP client has to answer: what a malformed payload returns, what happens when `PUT` arrives with no `If-Match`, and which status codes each endpoint sends.

## What Changes

- Add a stubbed "server" over an in-memory store that answers `GET /users`, `GET /users/{id}`, `POST /users`, `PUT /users/{id}` and `POST /users/{id}/password-reset` with real status codes, headers and JSON bodies.
- Seed the store with 500,000 users without building 500,000 objects up front, so paging costs the same on page 1 and page 20,000.
- Track a version per user and expose it as an `ETag`; enforce `If-Match` on `PUT`.
- Add a typed client service the UI calls for list, get, create, update and password reset, returning the user together with its `ETag` and turning failures into one structured error type.
- Validate request payloads and query parameters on the stubbed server and answer with `400` and field-level messages.
- Cover every `user-api-client` scenario with Vitest tests.
- No UI in this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-api-client`: adds requirements for request validation (`400` with field errors), rejecting `PUT` without `If-Match` (`428 Precondition Required`), the success status code each endpoint returns, and writes being visible to later reads.

## Impact

- New code under `src/app/core/api/`; `src/app/app.config.ts` gains the HttpClient providers.
- Uses `@angular/common/http`, which ships with Angular; no new npm dependencies.
- Unblocks the nav, user list and user management tasks, which consume this layer.
