## MODIFIED Requirements

### Requirement: No drag-only interactions

No function in the admin UI SHALL require a dragging movement, with two
exceptions: reordering user grid columns by dragging SHALL be available
only after the admin turns on "Draggable columns" in table settings, and
resizing user grid columns by dragging SHALL be available only after the
admin turns on "Resizable columns" in table settings. Each SHALL be off by
default and SHALL be shown in table settings with a note that it fails WCAG
2.5.7. Anything else that can be dragged SHALL also be possible with a
single pointer action or the keyboard, or dragging SHALL be turned off. The
conformance report SHALL record each opt-in setting as a known gap for
2.5.7.

#### Scenario: Grid column headers
- **WHEN** an admin with default settings tries to reorder or resize a user
  grid column
- **THEN** either the action is not offered, or it is available without
  dragging

#### Scenario: Grid columns after opting in
- **WHEN** an admin has turned on Draggable columns and left Resizable
  columns off
- **THEN** columns can be reordered by dragging, column widths still cannot
  be resized, and the table settings dialog shows a 2.5.7 note beside the
  setting

#### Scenario: Resizing after opting in
- **WHEN** an admin has turned on Resizable columns and left Draggable
  columns off
- **THEN** column widths can be changed by dragging, columns still cannot
  be reordered, and the table settings dialog shows a 2.5.7 note beside the
  setting

#### Scenario: Gap recorded in the report
- **WHEN** a reviewer reads criterion 2.5.7 in the conformance report
- **THEN** it passes for default settings and names the Draggable columns
  and Resizable columns settings as known gaps while each is on

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
