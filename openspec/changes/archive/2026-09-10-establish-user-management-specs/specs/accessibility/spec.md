## Purpose

Ensures the admin UI is usable by keyboard and assistive-technology users,
conforming to WCAG 2.2.

## ADDED Requirements

### Requirement: Full keyboard operability

Every interactive element in the admin UI (nav entries, list pagination
controls, forms, buttons, conflict-resolution actions) SHALL be operable
using the keyboard alone.

#### Scenario: Keyboard-only task completion
- **WHEN** an admin navigates and operates the user management screen
  using only the keyboard
- **THEN** they can list, create, view, edit, and reset a password for a
  user without using a pointing device

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
