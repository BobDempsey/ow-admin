## MODIFIED Requirements

### Requirement: Full keyboard operability

Every interactive element in the admin UI (nav entries, list pagination
controls, the list's filter chips, Clear all and Clear filters, the user
grid's row Actions menu, forms, buttons, conflict-resolution actions, the
password reset confirmation) SHALL be operable using the keyboard alone.

#### Scenario: Keyboard-only task completion
- **WHEN** an admin navigates and operates the user management screens
  using only the keyboard
- **THEN** they can list, create, view, and edit a user, resolve an edit
  conflict, and trigger a password reset, without using a pointing device

#### Scenario: List actions from the keyboard
- **WHEN** an admin on the user list uses only the keyboard
- **THEN** they can remove a filter chip, use Clear all and Clear filters,
  and open a row's Actions menu to view a user or send a password reset,
  while the grid stays a single Tab stop

### Requirement: Sufficient color contrast

Text and meaningful UI elements SHALL meet WCAG 2.2 contrast minimums in
both the light and the dark theme. This includes the text in the user
grid's status and role pills and in the initials circles, measured
against the fill behind that text.

#### Scenario: Text contrast check
- **WHEN** any body text or control label is rendered
- **THEN** its contrast ratio against its background meets WCAG 2.2 AA
  minimums

#### Scenario: Contrast in both themes
- **WHEN** any screen, state or the conflict dialog is rendered in the
  light theme and again in the dark theme
- **THEN** text meets 4.5:1 (3:1 for large text), and focus indicators,
  input borders and the selected theme and nav indicators meet 3:1
  against their backgrounds, in each theme

#### Scenario: Pills and initials in both themes
- **WHEN** the user list shows an active, an invited and a suspended user,
  with Striped rows off and on, in the light and the dark theme
- **THEN** the text in each status pill, each role pill and each initials
  circle meets 4.5:1 against that pill's or circle's fill

### Requirement: Focus not obscured

The keyboard focus indicator SHALL never be entirely hidden by other
content, including fixed or overlaid elements.

#### Scenario: Tabbing through a screen
- **WHEN** an admin tabs through every focusable element on any screen at
  1280 and 320 CSS pixels wide
- **THEN** each focused element is at least partly visible in the viewport

#### Scenario: Rows under a fixed header
- **WHEN** Fixed header is on and an admin moves focus with the arrow keys
  down through every row of a 100-row page and back up
- **THEN** the focused cell is never entirely hidden behind the column
  header row

#### Scenario: Controls above the save bar
- **WHEN** the detail screen has unsaved edits, so its save bar stays in
  view, and an admin tabs through every focusable element at 1280 by 600
  and 320 by 568 CSS pixels
- **THEN** each focused element is at least partly visible and is not
  hidden behind the save bar
