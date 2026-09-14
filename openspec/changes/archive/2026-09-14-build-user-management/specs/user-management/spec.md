## MODIFIED Requirements

### Requirement: Create a user

The system SHALL let an admin create a new user from a create screen at `/users/new` by submitting name, email, role, and status via `user-api-client`'s `POST /users`. After a successful create, the system SHALL show the new user's detail screen at `/users/{id}` with a confirmation announced to assistive technology.

#### Scenario: New user form defaults
- **WHEN** an admin opens `/users/new`
- **THEN** the form shows empty name and email fields, role set to Member, and status set to invited

#### Scenario: Successful create
- **WHEN** an admin submits a valid new-user form
- **THEN** the system calls `POST /users`, the user is created, and the admin lands on `/users/{id}` for the new user with a message saying the user was created

#### Scenario: Create validation error
- **WHEN** an admin submits a new-user form missing a required field or with an invalid value
- **THEN** the system shows field-level validation errors and does not submit the request

### Requirement: View user details

The system SHALL let an admin view an existing user's `id`, `name`, `email`, `role`, and `status` by fetching it via `GET /users/{id}` and retaining the returned `ETag` for later edits.

#### Scenario: Open existing user
- **WHEN** an admin navigates to a user's detail screen
- **THEN** the system fetches the user via `GET /users/{id}`, displays its fields, and stores the response `ETag` for use on save

#### Scenario: Open a user by URL
- **WHEN** an admin loads `/users/u-000042` directly in the browser
- **THEN** the detail screen fetches and shows that user without passing through the list

### Requirement: Edit user details

The system SHALL show an existing user's editable fields (name, email, role, status) in a form on the detail screen, SHALL save changes via `PUT /users/{id}` with `If-Match` set to the last-read `ETag`, and SHALL let the admin discard unsaved changes.

#### Scenario: Successful edit
- **WHEN** an admin edits a user's fields and saves, and the stored `If-Match` still matches the server's current `ETag`
- **THEN** the update is applied, the screen updates to the new `ETag`, and the admin sees confirmation

#### Scenario: Edit validation error
- **WHEN** an admin clears the name or enters an invalid email and saves
- **THEN** the system shows field-level validation errors and does not send `PUT /users/{id}`

#### Scenario: Cancel unsaved changes
- **WHEN** an admin edits fields and activates Cancel
- **THEN** the form shows the values from the last successful load or save, and no request is sent

### Requirement: Edit conflict handling

When `PUT /users/{id}` returns `412 Precondition Failed`, the system SHALL surface the conflict to the admin in a modal dialog and let them reload the latest data, overwrite it with their changes, or keep editing without either.

#### Scenario: Conflicting concurrent edit
- **WHEN** an admin saves an edit and another change to the same user happened first, causing a `412` response
- **THEN** the system tells the admin their data is stale and offers to reload the current data, overwrite it with their changes, or keep editing

#### Scenario: Reload after conflict
- **WHEN** an admin chooses to reload after a conflict
- **THEN** the system re-fetches the user via `GET /users/{id}`, discards the admin's unsaved edit, and updates the stored `ETag`

#### Scenario: Overwrite after conflict
- **WHEN** an admin chooses to overwrite after a conflict
- **THEN** the system re-fetches the current `ETag` via `GET /users/{id}` and retries `PUT /users/{id}` with the admin's edited values and the fresh `If-Match`

#### Scenario: Keep editing after conflict
- **WHEN** an admin chooses keep editing, or dismisses the dialog with Escape
- **THEN** the dialog closes, the admin's edited values stay in the form, no request is sent, and focus returns to the Save button

#### Scenario: Conflict again during overwrite
- **WHEN** the retried `PUT /users/{id}` during an overwrite also returns `412`
- **THEN** the system shows the conflict dialog again instead of failing silently

## ADDED Requirements

### Requirement: User detail load states

The detail screen SHALL announce while the user is loading, SHALL tell the admin when the user does not exist, and SHALL offer a keyboard-operable retry when loading fails for any other reason.

#### Scenario: User loading
- **WHEN** an admin opens a user's detail screen and `GET /users/{id}` has not answered
- **THEN** the screen shows a status message saying the user is loading, announced through a polite live region

#### Scenario: User not found
- **WHEN** `GET /users/{id}` answers `404`
- **THEN** the screen says the user was not found, shows no form, and offers a link back to the user list

#### Scenario: Load failure with retry
- **WHEN** `GET /users/{id}` answers with any other error status
- **THEN** the screen shows a message saying the user could not be loaded, announced as an alert, with a Try again button that repeats the request

### Requirement: Server-side validation errors

When `POST /users` or `PUT /users/{id}` answers `400` with field errors, the system SHALL show each message on its matching form field and SHALL keep the admin's entered values.

#### Scenario: Field error from the API
- **WHEN** a create or save answers `400` with a field error for `email`
- **THEN** the email field shows that message, is marked invalid to assistive technology, and every entered value is still in the form

### Requirement: Unexpected save failure

When a create or save fails with a status other than `400` or `412`, the system SHALL show an error announced as an alert and SHALL keep the admin's entered values so they can try again.

#### Scenario: Save fails
- **WHEN** an admin saves and `PUT /users/{id}` answers `500`
- **THEN** the screen shows a message saying the user could not be saved, announced as an alert, and the edited values stay in the form

### Requirement: Simulate a concurrent edit

The detail screen SHALL offer a clearly labeled control that changes the displayed user through `user-api-client` the way a second admin would, without updating the `ETag` the screen holds, so an admin can reproduce an edit conflict in one browser tab.

#### Scenario: Simulated edit causes a conflict
- **WHEN** an admin activates "Simulate an edit by another admin" and then saves the form
- **THEN** the system announces that another admin changed the user, and the save answers `412` and opens the conflict dialog

#### Scenario: Simulated edit is visible after reload
- **WHEN** an admin simulates an edit and then chooses Reload in the conflict dialog
- **THEN** the form shows the values the simulated edit wrote
