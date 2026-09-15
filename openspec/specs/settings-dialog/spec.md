# settings-dialog Specification

## Purpose
Gives admins one modal dialog, opened from the Settings nav entry, for
display preferences: the theme and how the user table looks and behaves.
Settings apply at once, persist in the browser, and say plainly when a
choice fails a WCAG 2.2 criterion.

## Requirements

### Requirement: Open settings from the nav

Activating the Settings nav entry SHALL open a modal dialog titled
"Settings" on any admin screen without changing the URL. The Settings entry
SHALL be exposed to assistive technology as a button that opens a dialog.

#### Scenario: Open from the nav
- **WHEN** an admin activates the Settings nav entry on the user list
- **THEN** a modal dialog named "Settings" opens, the URL stays `/users`,
  and content behind the dialog cannot be reached with Tab or the pointer

#### Scenario: Entry announced as opening a dialog
- **WHEN** an assistive technology inspects the Settings nav entry
- **THEN** it reports a button named "Settings" that opens a dialog, and not
  an unavailable placeholder

### Requirement: Dialog focus and closing

Opening the dialog SHALL move focus into it, and focus SHALL stay inside
while it is open. The dialog SHALL close when the admin activates its Close
button or presses Escape, and on close focus SHALL return to the Settings
nav entry.

#### Scenario: Focus on open
- **WHEN** the Settings dialog opens
- **THEN** focus is on the dialog's "Settings" heading or its first
  control, and pressing Tab repeatedly never moves focus to the page behind
  it

#### Scenario: Close with the button
- **WHEN** an admin activates Close
- **THEN** the dialog closes and focus is on the Settings nav entry

#### Scenario: Close with Escape
- **WHEN** an admin presses Escape while the dialog is open
- **THEN** the dialog closes and focus is on the Settings nav entry

### Requirement: Theme setting

The dialog SHALL offer the theme choices Light, Dark and System as a group
named "Theme", with the same effect and remembered value as the header
Theme control. A choice made in either place SHALL show as selected in the
other.

#### Scenario: Choose Dark in settings
- **WHEN** an admin selects Dark in the Settings dialog
- **THEN** the dark theme applies at once and, after the dialog closes, the
  header Theme control shows Dark selected

#### Scenario: Header choice shown in settings
- **WHEN** an admin selects Light in the header and then opens Settings
- **THEN** Light is selected in the dialog's Theme group

### Requirement: Table settings

The dialog SHALL offer three settings for the user table: "Striped rows"
(on or off, off by default), "Density" (Comfortable or Compact, Comfortable
by default), and "Draggable columns" (on or off, off by default). Striped
rows SHALL give alternate rows a different background in both themes.
Comfortable SHALL keep today's row height; Compact SHALL use shorter rows
that still show two lines of wrapped cell text without clipping when WCAG
1.4.12 text spacing is applied. Draggable columns SHALL let the admin
reorder columns by dragging a column header; with it off, columns SHALL NOT
move. Column widths SHALL NOT become resizable through any setting.

#### Scenario: Defaults
- **WHEN** an admin opens Settings in a browser with no remembered settings
- **THEN** Striped rows is off, Density is Comfortable, and Draggable
  columns is off

#### Scenario: Striped rows
- **WHEN** an admin turns on Striped rows and views the user list in the
  light and the dark theme
- **THEN** alternate rows have a different background, and cell text on
  both backgrounds meets 4.5:1

#### Scenario: Compact density under text spacing
- **WHEN** Density is Compact and WCAG text spacing is applied to the user
  list at 320 CSS pixels wide
- **THEN** rows are shorter than in Comfortable and no cell text is clipped

#### Scenario: Dragging a column when on
- **WHEN** Draggable columns is on and an admin drags the Email column
  header onto the Name column header
- **THEN** Email becomes the first column

#### Scenario: Dragging a column when off
- **WHEN** Draggable columns is off and an admin drags the Email column
  header onto the Name column header
- **THEN** the column order does not change

### Requirement: Settings apply at once and are remembered

Each setting SHALL take effect as soon as the admin changes it, with no
Save step, including on a user list already on screen. The system SHALL
remember each setting in the browser and restore it on later loads. When
the browser cannot store settings, changes SHALL still apply for the
current page load without an error. Column order changed by dragging SHALL
NOT be remembered.

#### Scenario: Change applies while the list is open
- **WHEN** an admin on the user list opens Settings and selects Compact
- **THEN** the grid behind the dialog uses compact rows without a reload
  and stays on the same page of users

#### Scenario: Settings survive a reload
- **WHEN** an admin turns on Striped rows, selects Compact, and reloads the
  page
- **THEN** Settings shows Striped rows on and Compact selected, and the list
  uses both

#### Scenario: Storage unavailable
- **WHEN** the browser refuses to store settings and an admin turns on
  Striped rows
- **THEN** striped rows apply for that page load without an error

### Requirement: WCAG notes on non-conforming choices

When a setting's selected value makes the app fail a WCAG 2.2 level A or AA
criterion, the dialog SHALL show a note next to that setting naming the
criterion by number and name and saying who is affected. The note SHALL be
programmatically associated with the setting's control. Settings whose
every value conforms SHALL show no such note. Draggable columns set to on
SHALL show a note for 2.5.7 Dragging Movements.

#### Scenario: Note for draggable columns
- **WHEN** an admin turns on Draggable columns
- **THEN** a note next to it names "2.5.7 Dragging Movements" and says
  columns can then be moved only by dragging, with no keyboard or
  single-pointer alternative

#### Scenario: Note announced with the control
- **WHEN** an assistive technology inspects the Draggable columns control
- **THEN** its description includes the WCAG note

#### Scenario: No note for conforming choices
- **WHEN** Draggable columns is off, and any theme, striping and density
  are selected
- **THEN** the dialog shows no WCAG failure note

### Requirement: Accessible settings dialog

The Settings dialog SHALL meet the same accessibility checks as the rest of
the admin UI: every control labeled, operable by keyboard, at least 24 by
24 CSS pixels, visible focus, contrast minimums in both themes, and usable
at 320 CSS pixels wide without the page scrolling sideways.

#### Scenario: Narrow viewport
- **WHEN** the Settings dialog is open at 320 CSS pixels wide
- **THEN** every setting and the Close button are reachable, nothing is cut
  off, and the page does not scroll horizontally

#### Scenario: Automated checks
- **WHEN** axe runs on the open Settings dialog in the light and the dark
  theme at 1280 and 320 CSS pixels wide
- **THEN** it reports no WCAG A or AA violations
