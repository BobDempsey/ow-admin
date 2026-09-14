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

### Requirement: Success status codes

Each endpoint SHALL answer a successful request with a fixed status code:
`200 OK` for `GET /users`, `GET /users/{id}` and `PUT /users/{id}`;
`201 Created` with a `Location` header for `POST /users`; and
`204 No Content` for `POST /users/{id}/password-reset`.

#### Scenario: Create returns 201
- **WHEN** a caller submits a valid `POST /users`
- **THEN** the response status is `201`, the body is the created user, and
  the response carries `ETag` and a `Location` header of `/users/{id}`

#### Scenario: Password reset returns 204
- **WHEN** a caller submits `POST /users/{id}/password-reset` for an
  existing user
- **THEN** the response status is `204` with an empty body

### Requirement: Request payload validation

`POST /users` and `PUT /users/{id}` SHALL reject a payload whose `name` is
blank, whose `email` is not a valid email address, or whose `role` or
`status` falls outside its defined values, responding `400 Bad Request`
with an error body that lists a message for each invalid field. A rejected
request SHALL leave the store unchanged.

#### Scenario: Create with invalid fields
- **WHEN** a caller submits `POST /users` with a blank `name` and an
  `email` of `not-an-email`
- **THEN** the response status is `400`, the error body names both `name`
  and `email` with a message for each, and no user is created

#### Scenario: Update with an unknown role
- **WHEN** a caller submits `PUT /users/{id}` with a matching `If-Match`
  and a `role` of `Owner`
- **THEN** the response status is `400`, the error body names `role`, and
  the stored user and its `ETag` are unchanged

#### Scenario: Update tries to change the id
- **WHEN** a caller submits `PUT /users/{id}` with a body whose `id`
  differs from the `{id}` in the path
- **THEN** the response status is `400` and the stored user is unchanged

### Requirement: Pagination parameter validation

`GET /users` SHALL respond `400 Bad Request` when `skip` is negative or not
an integer, or when `limit` is less than 1 or not an integer. A `limit`
above 100 SHALL still be capped at 100, not rejected.

#### Scenario: Negative skip
- **WHEN** a caller requests `GET /users?skip=-1`
- **THEN** the response status is `400` with a message naming `skip`

#### Scenario: Zero limit
- **WHEN** a caller requests `GET /users?limit=0`
- **THEN** the response status is `400` with a message naming `limit`

### Requirement: Update without If-Match is rejected

`PUT /users/{id}` SHALL respond `428 Precondition Required` when the
request carries no `If-Match` header, and SHALL leave the stored user
unchanged.

#### Scenario: Missing If-Match
- **WHEN** a caller submits `PUT /users/{id}` for an existing user without
  an `If-Match` header
- **THEN** the response status is `428` and the stored user and its `ETag`
  are unchanged

### Requirement: Writes are visible to later reads

A user created or updated through the API layer SHALL be returned by later
`GET /users` and `GET /users/{id}` requests in the same session, and
`total` SHALL count created users.

#### Scenario: Created user is listed
- **WHEN** a caller creates a user and then requests the last page of
  `GET /users`
- **THEN** `total` has grown by one and the last page includes the created
  user

#### Scenario: Updated user is read back
- **WHEN** a caller updates a user and then requests `GET /users/{id}`
- **THEN** the response carries the updated fields and the same `ETag` the
  update returned
