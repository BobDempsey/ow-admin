## ADDED Requirements

### Requirement: Created notice shown once

The detail screen SHALL show the "User created." confirmation only on the
navigation that follows a successful create. Reloading the screen, or
returning to it with the browser's Back or Forward buttons, SHALL NOT show
it again. The confirmation SHALL NOT be shown while the screen says the
user was not found or could not be loaded.

#### Scenario: Notice after a create
- **WHEN** an admin creates a user and lands on its detail screen
- **THEN** the status message reads "User created."

#### Scenario: No notice after a reload
- **WHEN** an admin creates a user and then reloads the detail screen
- **THEN** the status message does not read "User created.", whatever the
  screen then shows

#### Scenario: No notice after Back and Forward
- **WHEN** an admin creates a user, activates "Back to users", and then
  uses the browser's Back button to return to the detail screen
- **THEN** the user's details show and the status message does not read
  "User created."

#### Scenario: No notice beside a missing user
- **WHEN** the detail screen says the user was not found
- **THEN** the status message does not read "User created."

## MODIFIED Requirements

### Requirement: Edit user details

The system SHALL show an existing user's editable fields (name, email,
role, status) in a form on the detail screen, SHALL save changes via
`PUT /users/{id}` with `If-Match` set to the last-read `ETag`, and SHALL
let the admin discard unsaved changes with a Cancel control. Cancel SHALL
discard any unsaved edits, send no save request, and return the admin to
the user list at `/users`, the same way Cancel does on the create screen.
Cancel SHALL do this whether or not any field was changed.

#### Scenario: Successful edit
- **WHEN** an admin edits a user's fields and saves, and the stored
  `If-Match` still matches the server's current `ETag`
- **THEN** the update is applied, the screen updates to the new `ETag`, and
  the admin sees confirmation

#### Scenario: Edit validation error
- **WHEN** an admin clears the name or enters an invalid email and saves
- **THEN** the system shows field-level validation errors and does not
  send `PUT /users/{id}`

#### Scenario: Cancel unsaved changes
- **WHEN** an admin edits fields and activates Cancel
- **THEN** no `PUT /users/{id}` is sent, the user list at `/users` loads
  with focus on its heading, and opening the same user again shows the
  values from the last successful load or save

#### Scenario: Cancel without edits
- **WHEN** an admin opens a user's detail screen and activates Cancel with
  a pointer or the keyboard without changing any field
- **THEN** the user list at `/users` loads with focus on its heading and no
  `PUT /users/{id}` is sent
