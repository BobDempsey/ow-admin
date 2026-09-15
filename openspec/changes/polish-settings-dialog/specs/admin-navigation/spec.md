## ADDED Requirements

### Requirement: Unavailable nav entries

Nav entries other than user management and About SHALL be rendered as
non-functional placeholders that do not navigate or error when activated.
Each placeholder SHALL stay keyboard-focusable and SHALL be exposed to
assistive technology as unavailable.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and
  does not error

#### Scenario: Placeholder entry announced as unavailable
- **WHEN** an assistive technology inspects a placeholder nav entry
- **THEN** the entry reports itself as disabled and its accessible name
  says the screen is not available yet

#### Scenario: Settings is a placeholder
- **WHEN** an admin activates the Settings nav entry
- **THEN** no dialog opens, the screen does not change, and the entry is
  reported as unavailable like Dashboard and Reports

## REMOVED Requirements

### Requirement: Placeholder nav entries
**Reason**: Its "Settings is not a placeholder" scenario no longer holds once the table settings dialog opens from the user list, and a MODIFIED block cannot drop a scenario.
**Migration**: Replaced by "Unavailable nav entries", which keeps the other two scenarios word for word and makes Settings a placeholder again.
