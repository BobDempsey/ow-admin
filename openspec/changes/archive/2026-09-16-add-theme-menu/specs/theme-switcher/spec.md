## ADDED Requirements

### Requirement: Theme menu opening and closing

The Theme button SHALL open its menu when activated by pointer, Enter or
Space, or when Down Arrow is pressed on it, with focus on the currently
selected choice. While the menu is open, Down Arrow and Up Arrow SHALL move
focus to the next and previous choice, wrapping at either end, and Home and
End SHALL move focus to the first and last choice. Enter or Space on a
choice, or a pointer click on it, SHALL select it, close the menu and return
focus to the Theme button. Escape SHALL close the menu without changing the
choice and return focus to the Theme button. Tab SHALL close the menu and
let focus move on. A pointer click outside the menu SHALL close it without
changing the choice. The menu SHALL stay within the viewport and SHALL NOT
cover the Theme button.

#### Scenario: Open by keyboard
- **WHEN** focus is on the Theme button, System is selected, and an admin
  presses Enter
- **THEN** the menu opens and focus is on System

#### Scenario: Move and choose by keyboard
- **WHEN** the menu is open with focus on System and an admin presses Home
  and then Down Arrow and Enter
- **THEN** Dark is selected, the dark theme applies, the menu closes, and
  focus is on the Theme button

#### Scenario: Escape closes without choosing
- **WHEN** the menu is open with focus moved to Light and an admin presses
  Escape
- **THEN** the menu closes, the previous choice stays selected, and focus
  is on the Theme button

#### Scenario: Click outside closes
- **WHEN** the menu is open and an admin clicks the page's main content
- **THEN** the menu closes and the choice does not change

#### Scenario: Menu fits a narrow screen
- **WHEN** the menu is open at 320 CSS pixels wide
- **THEN** every choice is fully visible, each is at least 24 by 24 CSS
  pixels, and the page does not scroll sideways

## MODIFIED Requirements

### Requirement: Theme control in the header

Every admin screen SHALL show a button in the header with the accessible
name "Theme" that opens a menu of three choices, Light, Dark and System, of
which exactly one is selected. The button SHALL be exposed to assistive
technology as opening a menu and SHALL report whether the menu is open.
The choices SHALL be exposed as checkable menu items named Light, Dark and
System, with the selected one marked as checked. The selected choice SHALL
be shown in the open menu by a check mark or other shape, not by color
alone. Each choice's accessible name SHALL stay its text name even if its
visible label is later shown as an icon.

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
  menu
- **THEN** it reports a button named "Theme" that opens a menu and is
  expanded, and a menu containing three checkable items, with the selected
  one marked as checked

#### Scenario: Collapsed state announced
- **WHEN** an assistive technology inspects the Theme button while its menu
  is closed
- **THEN** it reports the button as collapsed
