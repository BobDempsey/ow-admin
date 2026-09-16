# settings-dialog Specification

## Purpose
Gives admins one modal Table settings dialog, opened from a button on the
user list, for how the user table looks and behaves. Settings apply at
once, persist in the browser, and say plainly when a choice fails a WCAG
2.2 criterion.

## Requirements

### Requirement: Dialog focus and closing

Opening the dialog SHALL move focus into it, and focus SHALL stay inside
while it is open. The dialog SHALL close when the admin activates its Close
button or presses Escape, and on close focus SHALL return to the Table
settings button.

#### Scenario: Focus on open
- **WHEN** the Table settings dialog opens
- **THEN** focus is on the dialog's "Table settings" heading or its first
  control, and pressing Tab repeatedly never moves focus to the page behind
  it

#### Scenario: Close with the button
- **WHEN** an admin activates Close
- **THEN** the dialog closes and focus is on the Table settings button

#### Scenario: Close with Escape
- **WHEN** an admin presses Escape while the dialog is open
- **THEN** the dialog closes and focus is on the Table settings button

### Requirement: Table settings

The dialog SHALL offer five settings for the user table: "Striped rows"
(on or off, off by default), "Density" (Comfortable or Compact, Compact
by default), "Draggable columns" (on or off, off by default), "Resizable
columns" (on or off, off by default) and "Fixed header" (on or off, off by
default). Striped rows SHALL give alternate rows a different background in
both themes. Comfortable SHALL keep today's row height; Compact SHALL use
shorter rows that still show two lines of wrapped cell text without
clipping when WCAG 1.4.12 text spacing is applied. Draggable columns SHALL
let the admin reorder columns by dragging a column header; with it off,
columns SHALL NOT move. Resizable columns SHALL let the admin change a
column's width by dragging the edge of its header, never narrower than
the width that keeps its cell text to two lines; with it off, column widths
SHALL NOT change. Fixed header SHALL keep the column header row visible
while the admin scrolls through the rows of a page; with it off, the grid
SHALL grow to show every row of the page and scroll with the screen.

#### Scenario: Defaults
- **WHEN** an admin opens Table settings in a browser with no remembered
  settings
- **THEN** Striped rows is off, Density is Compact, and Draggable
  columns, Resizable columns and Fixed header are off

#### Scenario: Remembered Comfortable kept
- **WHEN** a browser remembered Density as Comfortable before Compact became
  the default, and an admin loads the user list
- **THEN** the list uses Comfortable rows and Table settings shows
  Comfortable selected

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

#### Scenario: Resizing a column when on
- **WHEN** Resizable columns is on and an admin drags the right edge of
  the Email column header to the left
- **THEN** the Email column becomes narrower, and stops at the width that
  still shows its cell text in two lines

#### Scenario: Resizing a column from the keyboard when on
- **WHEN** Resizable columns is on, focus is on the Email column header,
  and an admin presses Alt with Left Arrow
- **THEN** the Email column becomes narrower

#### Scenario: Resizing a column when off
- **WHEN** Resizable columns is off and an admin drags the right edge of
  the Email column header, or presses Alt with Left Arrow on it
- **THEN** no column width changes

#### Scenario: Fixed header when on
- **WHEN** Fixed header is on, the page size is 100, and an admin scrolls
  to the last row of the page
- **THEN** the column header row is still visible above the rows, and the
  paging controls are reachable without leaving the list

#### Scenario: Fixed header when off
- **WHEN** Fixed header is off and an admin scrolls down a 100-row page
- **THEN** the grid shows every row of the page with no scroll area of its
  own, and the header scrolls out of view with the screen

#### Scenario: Fixed header at 400 percent zoom
- **WHEN** Fixed header is on and the user list is shown at 320 by 256 CSS
  pixels
- **THEN** every row, the header and the paging controls can be reached,
  and the page does not scroll sideways

### Requirement: Settings apply at once and are remembered

Each setting SHALL take effect as soon as the admin changes it, with no
Save step, including on the user list behind the dialog. The system SHALL
remember each setting in the browser and restore it on later loads. When
the browser cannot store settings, changes SHALL still apply for the
current page load without an error. Column order changed by dragging SHALL
NOT be remembered.

#### Scenario: Change applies while the list is open
- **WHEN** an admin on the user list opens Table settings and selects
  Comfortable
- **THEN** the grid behind the dialog uses comfortable rows without a
  reload and stays on the same page of users

#### Scenario: Settings survive a reload
- **WHEN** an admin turns on Striped rows, selects Comfortable, and reloads
  the page
- **THEN** Table settings shows Striped rows on and Comfortable selected,
  and the list uses both

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
SHALL show a note for 2.5.7 Dragging Movements, and so SHALL Resizable
columns set to on.

#### Scenario: Note for draggable columns
- **WHEN** an admin turns on Draggable columns
- **THEN** a note next to it names "2.5.7 Dragging Movements" and says
  columns can then be moved only by dragging, with no keyboard or
  single-pointer alternative

#### Scenario: Note for resizable columns
- **WHEN** an admin turns on Resizable columns
- **THEN** a note next to it names "2.5.7 Dragging Movements" and says
  column widths can then be changed by dragging or from the keyboard, with
  no single-pointer alternative

#### Scenario: Note announced with the control
- **WHEN** an assistive technology inspects the Draggable columns control
- **THEN** its description includes the WCAG note

#### Scenario: No note for conforming choices
- **WHEN** Draggable columns and Resizable columns are off, and any
  striping, density and Fixed header value are selected
- **THEN** the dialog shows no WCAG failure note

### Requirement: Accessible settings dialog

The Table settings dialog and its opening button SHALL meet the same
accessibility checks as the rest of the admin UI: every control labeled,
operable by keyboard, at least 24 by 24 CSS pixels, visible focus, contrast
minimums in both themes, and usable at 320 CSS pixels wide without the page
scrolling sideways.

#### Scenario: Narrow viewport
- **WHEN** the Table settings dialog is open at 320 CSS pixels wide
- **THEN** every setting and the Close button are reachable, nothing is cut
  off, and the page does not scroll horizontally

#### Scenario: Automated checks
- **WHEN** axe runs on the open Table settings dialog in the light and the
  dark theme at 1280 and 320 CSS pixels wide
- **THEN** it reports no WCAG A or AA violations

### Requirement: Open table settings from the user list

The user list screen SHALL show a "Table settings" button at the top-right
of the card that holds the user table, on the same row as the Search
users field and across from it, outside the group of search and filter
controls. In keyboard order it SHALL come after the Status dropdown and
before any filter chips. On narrow screens the button SHALL wrap below
the filter controls rather than scroll sideways. Activating the button
SHALL open a modal dialog titled "Table settings" without changing the
URL. The button SHALL be exposed to assistive technology as a button that
opens a dialog. No other screen SHALL offer the dialog.

#### Scenario: Open from the user list
- **WHEN** an admin activates Table settings on the user list
- **THEN** a modal dialog named "Table settings" opens, the URL stays
  `/users`, and content behind the dialog cannot be reached with Tab or the
  pointer

#### Scenario: Button announced as opening a dialog
- **WHEN** an assistive technology inspects the Table settings button
- **THEN** it reports a button named "Table settings" that opens a dialog

#### Scenario: Button beside search
- **WHEN** the user list is shown at 1280 CSS pixels wide
- **THEN** the Table settings button is on the same row as the Search users
  field, at the opposite end of the row, in the top-right corner of the
  table card

#### Scenario: Not offered off the list
- **WHEN** an admin is on the About screen or a user's detail screen
- **THEN** no control on the screen opens the table settings dialog

#### Scenario: Outside the filter group
- **WHEN** an assistive technology lists the controls inside the user
  list's search and filter group
- **THEN** it finds Search users, Role and Status, and not Table settings

### Requirement: Selected state visible in both themes

Every radio and checkbox in the table settings dialog SHALL show whether it
is selected by shape, not by color alone: a selected radio SHALL show a
filled center and a selected checkbox a check mark, while an unselected one
SHALL show only an empty outline. In the light and the dark theme, the
outline of an unselected control and the fill of a selected control SHALL
each have at least 3:1 contrast against the dialog background.

#### Scenario: Unselected radio in dark theme
- **WHEN** the dark theme is on and an admin opens Table settings with
  Compact selected
- **THEN** the Comfortable radio shows an empty outline with no filled
  center, and the Compact radio shows a filled center

#### Scenario: Unselected checkbox in dark theme
- **WHEN** the dark theme is on and Striped rows is off
- **THEN** the Striped rows checkbox shows an empty outline with no check
  mark

#### Scenario: Control contrast in both themes
- **WHEN** the dialog is open in the light and the dark theme
- **THEN** each unselected control's outline and each selected control's
  fill measure at least 3:1 against the dialog background
