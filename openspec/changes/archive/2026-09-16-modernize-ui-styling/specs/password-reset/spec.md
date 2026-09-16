## ADDED Requirements

### Requirement: Trigger password reset from the user list

Choosing Reset password in a user row's Actions menu SHALL open the same
modal confirmation the detail screen uses, naming that row's user and
their email, with focus on Cancel. The system SHALL call `user-api-client`'s
`POST /users/{id}/password-reset` only after the admin confirms.
Cancelling, including with Escape, SHALL close the confirmation without a
request. When the confirmation closes, focus SHALL return to that row's
Actions cell, or to the list's heading when the row is no longer shown.
While the request runs, the list's polite status message SHALL say the
email is being sent, and choosing Reset password for the same user again
SHALL NOT send a second request. A success SHALL be shown on screen and
announced through the list's status message as "Password reset email sent
to {name}." A failure SHALL be shown as a message naming the user,
announced as an alert, with a Try again button that repeats the request
without asking for confirmation again and then moves focus the way
closing the confirmation does. A reset from the list SHALL NOT reload the
page of users or change the page, sort, search or filters.

#### Scenario: Reset from the list
- **WHEN** an admin opens the Actions menu in Radia Lamport's row, chooses
  Reset password, and confirms
- **THEN** the system calls `POST /users/{id}/password-reset` for that
  user, focus is on the row's Actions cell, and the status message reads
  "Password reset email sent to Radia Lamport."

#### Scenario: Confirmation from the list
- **WHEN** an admin chooses Reset password in a row's Actions menu
- **THEN** a modal dialog asks whether to send a password reset email,
  naming that row's user and email, focus is on Cancel, and no request has
  been sent

#### Scenario: Cancel from the list
- **WHEN** the confirmation opened from a row is showing and the admin
  presses Escape
- **THEN** the dialog closes, no request is sent, and focus is on that
  row's Actions cell

#### Scenario: Reset from the list in progress
- **WHEN** an admin has confirmed a reset from a row and the request has
  not answered
- **THEN** the list's status message says the email is being sent, and
  choosing Reset password for the same user again sends no second request

#### Scenario: Reset from the list fails
- **WHEN** the request answers with an error status
- **THEN** the list shows a message saying the password reset email to
  that user could not be sent, announced as an alert, with a Try again
  button

#### Scenario: Try again from the list
- **WHEN** an admin activates Try again after a failed reset from a row
- **THEN** the request is sent again without the confirmation, the alert
  goes away, and focus is on that row's Actions cell

#### Scenario: List left as it was
- **WHEN** an admin on the third page, sorted by name and filtered to
  Admin, sends a reset from a row
- **THEN** no list request is sent, and the page, sort and filter stay as
  they were
