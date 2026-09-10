# password-reset Specification

## Purpose
Lets an admin trigger a password reset for a user directly from the admin
UI.

## Requirements

### Requirement: Trigger password reset

The system SHALL let an admin trigger a password reset for a user from
that user's detail screen, calling `user-api-client`'s
`POST /users/{id}/password-reset`.

#### Scenario: Successful reset
- **WHEN** an admin activates the password reset action for a user
- **THEN** the system calls `POST /users/{id}/password-reset` and shows
  the admin confirmation that the reset was triggered

#### Scenario: Reset does not require a stored ETag
- **WHEN** an admin triggers a password reset without having first
  fetched a fresh `ETag` for the user
- **THEN** the request still succeeds, since password reset does not use
  `If-Match`
