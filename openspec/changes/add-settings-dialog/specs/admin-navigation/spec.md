## MODIFIED Requirements

### Requirement: Placeholder nav entries

Nav entries other than user management, About and Settings SHALL be rendered as non-functional placeholders that do not navigate or error when activated. Each placeholder SHALL stay keyboard-focusable and SHALL be exposed to assistive technology as unavailable.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and does not error

#### Scenario: Placeholder entry announced as unavailable
- **WHEN** an assistive technology inspects a placeholder nav entry
- **THEN** the entry reports itself as disabled and its accessible name says the screen is not available yet

#### Scenario: Settings is not a placeholder
- **WHEN** an admin activates the Settings nav entry
- **THEN** the Settings dialog opens, and the entry is not reported as disabled or unavailable
