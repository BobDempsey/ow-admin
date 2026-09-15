## MODIFIED Requirements

### Requirement: No drag-only interactions

No function in the admin UI SHALL require a dragging movement, with one exception: reordering user grid columns by dragging SHALL be available only after the admin turns on "Draggable columns" in settings, SHALL be off by default, and SHALL be shown in settings with a note that it fails WCAG 2.5.7. Anything else that can be dragged SHALL also be possible with a single pointer action or the keyboard, or dragging SHALL be turned off. The conformance report SHALL record the opt-in setting as a known gap for 2.5.7.

#### Scenario: Grid column headers
- **WHEN** an admin with default settings tries to reorder or resize a user grid column
- **THEN** either the action is not offered, or it is available without dragging

#### Scenario: Grid columns after opting in
- **WHEN** an admin has turned on Draggable columns
- **THEN** columns can be reordered by dragging, column widths still cannot be resized, and the settings dialog shows a 2.5.7 note beside the setting

#### Scenario: Gap recorded in the report
- **WHEN** a reviewer reads criterion 2.5.7 in the conformance report
- **THEN** it passes for default settings and names the Draggable columns setting as a known gap while it is on
