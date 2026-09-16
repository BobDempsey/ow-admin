## ADDED Requirements

### Requirement: Detail avatar

The detail screen SHALL show the loaded user's initials in a colored
circle beside the name heading, with the same initials and color the user
list shows for that user. The circle SHALL be hidden from assistive
technology, since the heading names the user. The circle SHALL NOT show
while the user is loading, when the user is not found, or when the load
fails.

#### Scenario: Avatar for a loaded user
- **WHEN** an admin opens `/users/u-000042` and the user loads
- **THEN** a circle with the user's initials shows beside the heading, in
  the same color as that user's circle in the list

#### Scenario: Avatar hidden from assistive technology
- **WHEN** an assistive technology reads the top of the detail screen
- **THEN** it reads the user's name once, from the heading

#### Scenario: No avatar without a user
- **WHEN** the detail screen shows "User not found" or a load failure
- **THEN** no initials circle is shown

### Requirement: Button icons

New user, Create user, Save, Cancel on the create and detail screens,
Reset password, and "Simulate an edit by another admin" SHALL each show an
icon before their visible text. Each icon SHALL be hidden from assistive
technology, so each control's accessible name stays its visible text.

#### Scenario: Names unchanged
- **WHEN** an assistive technology inspects these controls
- **THEN** their names are "New user", "Create user", "Save", "Cancel",
  "Reset password" and "Simulate an edit by another admin", with nothing
  added by the icons

#### Scenario: Icon beside the text
- **WHEN** an admin views the create screen or a user's detail screen at
  1280 and at 320 CSS pixels wide
- **THEN** each of these controls shows its icon to the left of its text,
  and the page does not scroll sideways
