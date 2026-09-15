## MODIFIED Requirements

### Requirement: Placeholder nav entries

Nav entries other than user management and About SHALL be rendered as non-functional placeholders that do not navigate or error when activated. Each placeholder SHALL stay keyboard-focusable and SHALL be exposed to assistive technology as unavailable.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and does not error

#### Scenario: Placeholder entry announced as unavailable
- **WHEN** an assistive technology inspects a placeholder nav entry
- **THEN** the entry reports itself as disabled and its accessible name says the screen is not available yet

### Requirement: Current screen indicated

The top navigation bar SHALL mark the entry for the current screen with `aria-current="page"` and SHALL show a visible indicator for it that does not depend on color alone.

#### Scenario: Users entry marked current
- **WHEN** an admin is on the user management screen
- **THEN** the user management nav entry has `aria-current="page"` and a visible non-color indicator, and no other entry has `aria-current`

#### Scenario: About entry marked current
- **WHEN** an admin is on the About screen
- **THEN** the About nav entry has `aria-current="page"` and a visible non-color indicator, and no other entry has `aria-current`
