## MODIFIED Requirements

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
