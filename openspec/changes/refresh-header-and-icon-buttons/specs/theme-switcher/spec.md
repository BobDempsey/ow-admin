## MODIFIED Requirements

### Requirement: Theme control in the header

Every admin screen SHALL show an icon-only button in the header whose icon
shows the current choice and whose accessible name is "Theme: " followed
by the current choice, given by visually hidden text: "Theme: Light",
"Theme: Dark" or "Theme: System". The button SHALL show a tooltip with the
same words, SHALL hide its icon from assistive technology, and SHALL be at
least 44 by 44 CSS pixels. The button SHALL open a menu named "Theme" of
three choices, Light, Dark and System, of which exactly one is selected.
The button SHALL be exposed to assistive technology as opening a menu and
SHALL report whether the menu is open. The choices SHALL be exposed as
checkable menu items named Light, Dark and System, with the selected one
marked as checked. The selected choice SHALL be shown in the open menu by
a check mark or other shape, not by color alone. Each choice's accessible
name SHALL stay its text name even if its visible label is later shown as
an icon.

#### Scenario: Control present on every screen
- **WHEN** an admin opens the user list, the new user screen, a user's
  detail screen, or the About screen
- **THEN** the header shows the Theme button, and opening it shows Light,
  Dark and System with one of them selected

#### Scenario: Choosing by keyboard
- **WHEN** an admin moves focus to the Theme button, opens the menu with
  the keyboard, and uses the arrow keys and Enter to select Dark
- **THEN** Dark becomes the selected choice and the dark theme applies
  without a page reload

#### Scenario: Selected choice announced
- **WHEN** an assistive technology inspects the Theme button and its open
  menu while System is selected
- **THEN** it reports a button named "Theme: System" that opens a menu and
  is expanded, and a menu named "Theme" containing three checkable items,
  with System marked as checked

#### Scenario: Name follows the choice
- **WHEN** an admin chooses Dark from the Theme menu
- **THEN** the Theme button's accessible name and tooltip both read
  "Theme: Dark"

#### Scenario: Collapsed state announced
- **WHEN** an assistive technology inspects the Theme button while its menu
  is closed
- **THEN** it reports the button as collapsed
