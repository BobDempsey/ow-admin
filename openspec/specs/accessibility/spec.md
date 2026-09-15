# accessibility Specification

## Purpose
Ensures the admin UI is usable by keyboard and assistive-technology users,
conforming to WCAG 2.2.

## Requirements

### Requirement: Full keyboard operability

Every interactive element in the admin UI (nav entries, list pagination
controls, forms, buttons, conflict-resolution actions) SHALL be operable
using the keyboard alone.

#### Scenario: Keyboard-only task completion
- **WHEN** an admin navigates and operates the user management screens
  using only the keyboard
- **THEN** they can list, create, view, and edit a user, and resolve an
  edit conflict, without using a pointing device

### Requirement: Visible focus and logical focus management

The system SHALL show a visible focus indicator on the focused element and
move focus predictably on navigation and dialog/panel open and close.

#### Scenario: Focus moves into a new view
- **WHEN** an admin navigates to a new screen or opens a modal (e.g. the
  conflict-resolution prompt)
- **THEN** focus moves to a sensible starting point within that view, and
  is visibly indicated

#### Scenario: Focus returns on close
- **WHEN** an admin closes a modal or dialog
- **THEN** focus returns to the element that opened it

### Requirement: Labeled form fields

Every form input in the create and edit user screens SHALL have a
programmatically associated label.

#### Scenario: Field has an accessible name
- **WHEN** an assistive technology inspects a form field on the create or
  edit user screen
- **THEN** the field exposes an accessible name matching its visible label

### Requirement: Accessible form error messaging

Validation and conflict errors SHALL be announced to assistive technology
and associated with the field or action they concern.

#### Scenario: Validation error announced
- **WHEN** a form submission fails validation
- **THEN** the error message is programmatically associated with the
  invalid field and announced to screen reader users

### Requirement: Sufficient color contrast

Text and meaningful UI elements SHALL meet WCAG 2.2 contrast minimums.

#### Scenario: Text contrast check
- **WHEN** any body text or control label is rendered
- **THEN** its contrast ratio against its background meets WCAG 2.2 AA
  minimums

### Requirement: Descriptive page titles

Every screen SHALL set a document title that names the screen and the
application, and the user detail screen's title SHALL name the user once
loaded.

#### Scenario: Detail screen title
- **WHEN** an admin opens the detail screen for a user named Radia Lamport
- **THEN** the document title becomes `Radia Lamport | Orbweaver Admin`

#### Scenario: Missing user title
- **WHEN** an admin opens the detail screen for an id that does not exist
- **THEN** the document title becomes `User not found | Orbweaver Admin`

### Requirement: Reflow and target size

Every screen SHALL be usable at a viewport 320 CSS pixels wide without
scrolling the page sideways, apart from the user grid's own scroll area,
and every pointer target SHALL be at least 24 by 24 CSS pixels or have that
much spacing.

#### Scenario: Narrow viewport
- **WHEN** any screen or the conflict dialog is shown at 320 CSS pixels
  wide
- **THEN** the page does not scroll horizontally and no content or control
  is cut off

#### Scenario: Small targets
- **WHEN** the target sizes of links, buttons and form controls are
  measured on any screen
- **THEN** each is at least 24 by 24 CSS pixels or passes the spacing
  exception

### Requirement: Text resize and spacing

Text SHALL stay readable and controls usable when text is resized to 200
percent and when WCAG 1.4.12 text spacing is applied (line height 1.5,
paragraph spacing 2 times, letter spacing 0.12 times and word spacing 0.16
times the font size).

#### Scenario: Text spacing override
- **WHEN** the text spacing override is applied to any screen
- **THEN** no text is clipped or overlapped and every control still works

#### Scenario: Browser zoom at 200 percent
- **WHEN** any screen is zoomed to 200 percent at a 1280 pixel window
- **THEN** all content and controls stay available without loss of
  information

### Requirement: No drag-only interactions

No function in the admin UI SHALL require a dragging movement; anything
that can be dragged SHALL also be possible with a single pointer action or
the keyboard, or dragging SHALL be turned off.

#### Scenario: Grid column headers
- **WHEN** an admin tries to reorder or resize a user grid column
- **THEN** either the action is not offered, or it is available without
  dragging

### Requirement: Focus not obscured

The keyboard focus indicator SHALL never be entirely hidden by other
content, including fixed or overlaid elements.

#### Scenario: Tabbing through a screen
- **WHEN** an admin tabs through every focusable element on any screen at
  1280 and 320 CSS pixels wide
- **THEN** each focused element is at least partly visible in the viewport

### Requirement: Published conformance report

The project SHALL include a WCAG 2.2 conformance report that lists every
level A and AA success criterion with its result (passes, not applicable,
or known gap) and how it was checked, including automated checks and
keyboard checks.

#### Scenario: Reviewer reads the report
- **WHEN** a reviewer opens the conformance report
- **THEN** every WCAG 2.2 A and AA criterion appears once with a result and
  its evidence, and every known gap names the affected screen
