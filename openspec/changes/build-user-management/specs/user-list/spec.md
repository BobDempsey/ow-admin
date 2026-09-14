## ADDED Requirements

### Requirement: New user entry point

The user list screen SHALL offer a keyboard-operable New user control that opens the create screen at `/users/new`.

#### Scenario: Open the create screen from the list
- **WHEN** an admin activates New user on the user list screen
- **THEN** the system navigates to `/users/new` and focus moves to that screen's heading

#### Scenario: New user control is a named link
- **WHEN** an assistive technology inspects the New user control
- **THEN** it is exposed as a link named "New user" whose target is `/users/new`
