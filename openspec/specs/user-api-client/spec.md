# user-api-client Specification

## Purpose
Provides a client-side API layer over an in-memory user store, shaped like
a real HTTP client, so the UI and any future real backend share the same
request/response contract.

## Requirements

### Requirement: User resource shape

Every user object returned by the API layer SHALL include `id`, `name`,
`email`, `role`, and `status` fields, where `role` is one of Admin, Member,
or Viewer, and `status` is one of active, invited, or suspended.

#### Scenario: User object fields
- **WHEN** the API layer returns a user, whether from list, get, or create
- **THEN** the returned object includes `id`, `name`, `email`, `role`, and
  `status`, with `role` and `status` restricted to their defined values

### Requirement: List users with pagination

`GET /users` SHALL return a paginated page of users using `skip` (default
0) and `limit` (default 25, max 100) query parameters, as
`{ items: User[], total: number }`.

#### Scenario: Default pagination
- **WHEN** a caller requests `GET /users` with no query parameters
- **THEN** the response contains up to 25 items starting at offset 0, and
  a `total` equal to the full user count

#### Scenario: Explicit page
- **WHEN** a caller requests `GET /users?skip=50&limit=25`
- **THEN** the response contains the users at offsets 50 through 74 (or
  fewer if fewer remain), and the same `total`

#### Scenario: Limit above maximum
- **WHEN** a caller requests `GET /users?limit=500`
- **THEN** the API layer caps the effective limit at 100

### Requirement: Get single user returns ETag

`GET /users/{id}` SHALL return the user and an `ETag` header representing
its current version.

#### Scenario: Fetch existing user
- **WHEN** a caller requests `GET /users/{id}` for an existing user
- **THEN** the response includes the user object and an `ETag` header

#### Scenario: Fetch missing user
- **WHEN** a caller requests `GET /users/{id}` for an id that does not exist
- **THEN** the API layer returns a not-found error response

### Requirement: Create user

`POST /users` SHALL create a new user and return it along with its initial
`ETag`, without requiring `If-Match`.

#### Scenario: Successful creation
- **WHEN** a caller submits `POST /users` with a valid new user payload
- **THEN** the API layer creates the user, assigns it an `id`, and returns
  the created user and an initial `ETag`

### Requirement: Update user requires If-Match

`PUT /users/{id}` SHALL require an `If-Match` header set to the user's
last-read `ETag`. A match SHALL apply the update and return a new `ETag`. A
mismatch SHALL return `412 Precondition Failed` without applying the
update.

#### Scenario: Matching ETag
- **WHEN** a caller submits `PUT /users/{id}` with `If-Match` equal to the
  user's current `ETag`
- **THEN** the update is applied and the response includes a new `ETag`

#### Scenario: Stale ETag
- **WHEN** a caller submits `PUT /users/{id}` with `If-Match` that does not
  match the user's current `ETag`
- **THEN** the API layer returns `412 Precondition Failed` and leaves the
  stored user unchanged

### Requirement: Password reset needs no If-Match

`POST /users/{id}/password-reset` SHALL trigger a password reset for the
given user without requiring an `If-Match` header.

#### Scenario: Reset existing user's password
- **WHEN** a caller submits `POST /users/{id}/password-reset` for an
  existing user
- **THEN** the API layer performs the reset and returns a success response
  without checking `If-Match`

### Requirement: HTTP-like error handling

The API layer SHALL surface errors as structured responses with status
codes and messages, matching how a real HTTP client would report request
failures, rather than throwing raw or unhandled exceptions.

#### Scenario: Not found error shape
- **WHEN** any endpoint is called with an id that does not exist
- **THEN** the API layer returns an error response carrying a 404-equivalent
  status and a descriptive message, not an unhandled exception
