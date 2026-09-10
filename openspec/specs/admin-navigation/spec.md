# admin-navigation Specification

## Purpose
Gives admins a consistent top navigation bar and a way to reach the user
management screen from anywhere in the admin UI.

## Requirements

### Requirement: Top navigation bar

The system SHALL display a top navigation bar on every admin screen.

#### Scenario: Nav bar present on load
- **WHEN** an admin loads any admin screen
- **THEN** the top navigation bar is visible

### Requirement: Link to user management

The top navigation bar SHALL include at least one entry that navigates to
the user management screen.

#### Scenario: Navigate to user management
- **WHEN** an admin activates the user management nav entry
- **THEN** the user management screen loads

### Requirement: Placeholder nav entries

Nav entries other than user management SHALL be rendered as non-functional
placeholders that do not navigate or error when activated.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and
  does not error
