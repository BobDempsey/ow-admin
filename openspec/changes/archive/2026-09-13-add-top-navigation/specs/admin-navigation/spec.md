## MODIFIED Requirements

### Requirement: Placeholder nav entries

Nav entries other than user management SHALL be rendered as non-functional placeholders that do not navigate or error when activated. Each placeholder SHALL stay keyboard-focusable and SHALL be exposed to assistive technology as unavailable.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and
  does not error

#### Scenario: Placeholder entry announced as unavailable
- **WHEN** an assistive technology inspects a placeholder nav entry
- **THEN** the entry reports itself as disabled and its accessible name says the screen is not available yet

## ADDED Requirements

### Requirement: Current screen indicated

The top navigation bar SHALL mark the entry for the current screen with `aria-current="page"` and SHALL show a visible indicator for it that does not depend on color alone.

#### Scenario: Users entry marked current
- **WHEN** an admin is on the user management screen
- **THEN** the user management nav entry has `aria-current="page"` and a visible non-color indicator, and no other entry has `aria-current`

### Requirement: Skip to main content

Every admin screen SHALL start with a skip link, visible when focused, that moves keyboard focus past the navigation to the main content.

#### Scenario: Skip link used
- **WHEN** a keyboard user presses Tab once on page load and activates the skip link
- **THEN** focus moves to the main content region, bypassing the nav entries

### Requirement: Document title per screen

Each admin screen SHALL set the document title to the screen's name followed by `| Orbweaver Admin`.

#### Scenario: Title on the user management screen
- **WHEN** the user management screen loads
- **THEN** the document title is `Users | Orbweaver Admin`

### Requirement: Default route

Loading the application root or an unknown path SHALL show the user management screen.

#### Scenario: Root URL
- **WHEN** an admin opens `/`
- **THEN** the URL becomes `/users` and the user management screen loads

#### Scenario: Unknown URL
- **WHEN** an admin opens a path no screen handles
- **THEN** the URL becomes `/users` and the user management screen loads

### Requirement: Navigation reflows at narrow widths

The top navigation bar SHALL remain fully usable at a viewport 320 CSS pixels wide, with every entry reachable without horizontal scrolling.

#### Scenario: Narrow viewport
- **WHEN** the viewport is 320 CSS pixels wide
- **THEN** all nav entries are visible or reachable by wrapping, and the page does not scroll horizontally
