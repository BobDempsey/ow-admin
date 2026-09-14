## ADDED Requirements

### Requirement: Success status codes

Each endpoint SHALL answer a successful request with a fixed status code: `200 OK` for `GET /users`, `GET /users/{id}` and `PUT /users/{id}`; `201 Created` with a `Location` header for `POST /users`; and `204 No Content` for `POST /users/{id}/password-reset`.

#### Scenario: Create returns 201
- **WHEN** a caller submits a valid `POST /users`
- **THEN** the response status is `201`, the body is the created user, and the response carries `ETag` and a `Location` header of `/users/{id}`

#### Scenario: Password reset returns 204
- **WHEN** a caller submits `POST /users/{id}/password-reset` for an existing user
- **THEN** the response status is `204` with an empty body

### Requirement: Request payload validation

`POST /users` and `PUT /users/{id}` SHALL reject a payload whose `name` is blank, whose `email` is not a valid email address, or whose `role` or `status` falls outside its defined values, responding `400 Bad Request` with an error body that lists a message for each invalid field. A rejected request SHALL leave the store unchanged.

#### Scenario: Create with invalid fields
- **WHEN** a caller submits `POST /users` with a blank `name` and an `email` of `not-an-email`
- **THEN** the response status is `400`, the error body names both `name` and `email` with a message for each, and no user is created

#### Scenario: Update with an unknown role
- **WHEN** a caller submits `PUT /users/{id}` with a matching `If-Match` and a `role` of `Owner`
- **THEN** the response status is `400`, the error body names `role`, and the stored user and its `ETag` are unchanged

#### Scenario: Update tries to change the id
- **WHEN** a caller submits `PUT /users/{id}` with a body whose `id` differs from the `{id}` in the path
- **THEN** the response status is `400` and the stored user is unchanged

### Requirement: Pagination parameter validation

`GET /users` SHALL respond `400 Bad Request` when `skip` is negative or not an integer, or when `limit` is less than 1 or not an integer. A `limit` above 100 SHALL still be capped at 100, not rejected.

#### Scenario: Negative skip
- **WHEN** a caller requests `GET /users?skip=-1`
- **THEN** the response status is `400` with a message naming `skip`

#### Scenario: Zero limit
- **WHEN** a caller requests `GET /users?limit=0`
- **THEN** the response status is `400` with a message naming `limit`

### Requirement: Update without If-Match is rejected

`PUT /users/{id}` SHALL respond `428 Precondition Required` when the request carries no `If-Match` header, and SHALL leave the stored user unchanged.

#### Scenario: Missing If-Match
- **WHEN** a caller submits `PUT /users/{id}` for an existing user without an `If-Match` header
- **THEN** the response status is `428` and the stored user and its `ETag` are unchanged

### Requirement: Writes are visible to later reads

A user created or updated through the API layer SHALL be returned by later `GET /users` and `GET /users/{id}` requests in the same session, and `total` SHALL count created users.

#### Scenario: Created user is listed
- **WHEN** a caller creates a user and then requests the last page of `GET /users`
- **THEN** `total` has grown by one and the last page includes the created user

#### Scenario: Updated user is read back
- **WHEN** a caller updates a user and then requests `GET /users/{id}`
- **THEN** the response carries the updated fields and the same `ETag` the update returned
