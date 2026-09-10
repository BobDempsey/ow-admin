# user-management Specification

## Purpose
Lets admins create new users and view or edit existing users' details,
including handling concurrent-edit conflicts safely.

## Requirements

### Requirement: Create a user

The system SHALL let an admin create a new user by submitting name, email,
role, and status via `user-api-client`'s `POST /users`.

#### Scenario: Successful create
- **WHEN** an admin submits a valid new-user form
- **THEN** the system calls `POST /users`, the user is created, and the
  admin sees confirmation with the new user's details

#### Scenario: Create validation error
- **WHEN** an admin submits a new-user form missing a required field or
  with an invalid value
- **THEN** the system shows field-level validation errors and does not
  submit the request

### Requirement: View user details

The system SHALL let an admin view an existing user's `id`, `name`,
`email`, `role`, and `status` by fetching it via `GET /users/{id}` and
retaining the returned `ETag` for later edits.

#### Scenario: Open existing user
- **WHEN** an admin navigates to a user's detail screen
- **THEN** the system fetches the user via `GET /users/{id}`, displays its
  fields, and stores the response `ETag` for use on save

### Requirement: Edit user details

The system SHALL let an admin edit an existing user's editable fields and
save the change via `PUT /users/{id}` with `If-Match` set to the last-read
`ETag`.

#### Scenario: Successful edit
- **WHEN** an admin edits a user's fields and saves, and the stored
  `If-Match` still matches the server's current `ETag`
- **THEN** the update is applied, the screen updates to the new `ETag`, and
  the admin sees confirmation

### Requirement: Edit conflict handling

When `PUT /users/{id}` returns `412 Precondition Failed`, the system SHALL
surface the conflict to the admin and let them either reload the latest
data or overwrite it.

#### Scenario: Conflicting concurrent edit
- **WHEN** an admin saves an edit and another change to the same user
  happened first, causing a `412` response
- **THEN** the system tells the admin their data is stale and offers to
  reload the current data or overwrite it with their changes

#### Scenario: Reload after conflict
- **WHEN** an admin chooses to reload after a conflict
- **THEN** the system re-fetches the user via `GET /users/{id}`, discards
  the admin's unsaved edit, and updates the stored `ETag`

#### Scenario: Overwrite after conflict
- **WHEN** an admin chooses to overwrite after a conflict
- **THEN** the system re-fetches the current `ETag` via `GET /users/{id}`
  and retries `PUT /users/{id}` with the admin's edited values and the
  fresh `If-Match`
