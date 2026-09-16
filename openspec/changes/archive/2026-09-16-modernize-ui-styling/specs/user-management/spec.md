## ADDED Requirements

### Requirement: Detail layout and save bar

At viewport widths of 1024 CSS pixels and wider, the detail screen SHALL
show the form on the left and the Password and Demo sections in a column
on its right; below 1024 CSS pixels, the sections SHALL follow the form
in one column. In keyboard order the form's fields, Save and Cancel SHALL
come before Reset password and "Simulate an edit by another admin" at
every width. Save and Cancel SHALL sit together in a bar at the end of
the form. While the form's values differ from the values last loaded or
saved, the bar SHALL show the text "Unsaved changes", SHALL announce it
once through a polite status message when the values first differ, and,
on viewports at least 480 CSS pixels tall, SHALL stay visible at the
bottom of the viewport while any part of the form is on screen. When the
values match again, after a save, a reload or the admin's own edits, the
text SHALL go away and the bar SHALL return to its place at the end of
the form. While the bar stays in view it SHALL NOT cover the focused
control.

#### Scenario: Two columns on a wide screen
- **WHEN** an admin opens a user's detail screen at 1280 CSS pixels wide
- **THEN** the Password and Demo sections sit to the right of the form

#### Scenario: One column on a narrow screen
- **WHEN** an admin opens a user's detail screen at 800 CSS pixels wide
- **THEN** the Password and Demo sections sit below the form, and the page
  does not scroll sideways

#### Scenario: Keyboard order
- **WHEN** an admin tabs through the detail screen at 1280 and at 320 CSS
  pixels wide
- **THEN** focus reaches Name, Email, Role, Status, Save and Cancel before
  Reset password and "Simulate an edit by another admin"

#### Scenario: Bar stays in view
- **WHEN** an admin changes the Name field on a viewport 320 by 568 CSS
  pixels and the end of the form is below the viewport
- **THEN** Save, Cancel and the text "Unsaved changes" are visible at the
  bottom of the viewport without scrolling

#### Scenario: Announced once
- **WHEN** an admin types five characters into the Name field
- **THEN** a polite status message reads "Unsaved changes" once, and not
  again for the later characters

#### Scenario: No bar text without edits
- **WHEN** an admin opens a user's detail screen and changes nothing
- **THEN** the text "Unsaved changes" is not shown and the bar sits at the
  end of the form

#### Scenario: Saved
- **WHEN** an admin with unsaved edits saves and the save succeeds
- **THEN** the text "Unsaved changes" goes away, the bar returns to the end
  of the form, and the status message reads "User saved."

#### Scenario: Edits undone by hand
- **WHEN** an admin changes the Status field and then sets it back to the
  loaded value
- **THEN** the text "Unsaved changes" goes away

#### Scenario: Focus not covered by the bar
- **WHEN** the bar is in view on a viewport 320 by 568 CSS pixels and an
  admin tabs and shift-tabs through the form's controls
- **THEN** no part of the focused control is behind the bar

#### Scenario: Short viewport
- **WHEN** an admin with unsaved edits views the detail screen at 320 by
  256 CSS pixels
- **THEN** the bar stays at the end of the form and scrolls with the page
