# password-reset Specification

## Purpose
Lets an admin trigger a password reset for a user directly from the admin
UI.

## Requirements

### Requirement: Trigger password reset

The system SHALL let an admin trigger a password reset for a user from
that user's detail screen, calling `user-api-client`'s
`POST /users/{id}/password-reset`. The control SHALL be a button with the
accessible name "Reset password", shown only while the user is loaded.
Activating it SHALL open a modal confirmation that names the user, with
focus on the choice that sends nothing; the request SHALL be sent only
after the admin confirms. Cancelling, including with Escape, SHALL close
the confirmation without a request. When the confirmation closes, focus
SHALL return to the "Reset password" button. While the request runs, the
screen SHALL announce it through the screen's polite status message and
SHALL NOT send a second request. A success SHALL be announced through the
same status message. A failure SHALL be shown as a message announced as an
alert, with a Try again button that repeats the request without asking for
confirmation again. A reset SHALL NOT change the form's values, discard
unsaved edits, or change the `ETag` the screen holds.

#### Scenario: Successful reset
- **WHEN** an admin activates the password reset action for a user
  and confirms
- **THEN** the system calls `POST /users/{id}/password-reset` and shows
  the admin confirmation that the reset was triggered, announced through
  the polite status message as "Password reset email sent."

#### Scenario: Reset does not require a stored ETag
- **WHEN** an admin triggers a password reset without having first
  fetched a fresh `ETag` for the user
- **THEN** the request still succeeds, since password reset does not use
  `If-Match`

#### Scenario: Confirmation opens
- **WHEN** an admin activates "Reset password"
- **THEN** a modal dialog asks whether to send a password reset email to
  the user, naming the user and their email, focus is on Cancel, and no
  request has been sent

#### Scenario: Cancel the reset
- **WHEN** the confirmation is open and the admin activates Cancel or
  presses Escape
- **THEN** the dialog closes, no request is sent, and focus returns to the
  "Reset password" button

#### Scenario: Reset in progress
- **WHEN** an admin has confirmed a reset and the request has not answered
- **THEN** the status message says the email is being sent, and
  activating "Reset password" again sends no second request

#### Scenario: Reset fails
- **WHEN** `POST /users/{id}/password-reset` answers with any error
  status, including `404`
- **THEN** the screen shows a message saying the password reset email
  could not be sent, announced as an alert, with a Try again button

#### Scenario: Try again after a failed reset
- **WHEN** an admin activates Try again after a failed reset
- **THEN** the system sends `POST /users/{id}/password-reset` again
  without opening the confirmation, the alert goes away, and focus moves
  to the "Reset password" button

#### Scenario: Unsaved edits survive a reset
- **WHEN** an admin changes a field without saving and then resets the
  user's password
- **THEN** the changed value is still in the form, and a later Save sends
  the `ETag` the screen held before the reset

#### Scenario: No reset for a missing user
- **WHEN** the detail screen shows that the user was not found, or that
  the user could not be loaded
- **THEN** no "Reset password" button is shown
