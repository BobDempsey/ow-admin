# theme-switcher Specification

## Purpose
Lets an admin choose a light or dark appearance for the admin UI, or follow
the operating system's color scheme, and keeps that choice across visits in
the same browser.

## Requirements

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

### Requirement: Applying the chosen theme

Choosing Light or Dark SHALL apply that theme whatever the operating
system's color scheme. Choosing System SHALL apply the theme matching the
operating system's color scheme, and SHALL switch themes when that scheme
changes while the app is open.

#### Scenario: Explicit choice overrides the OS
- **WHEN** the operating system prefers dark and the admin chooses Light
- **THEN** the app shows the light theme

#### Scenario: System follows the OS
- **WHEN** System is selected and the operating system prefers dark
- **THEN** the app shows the dark theme

#### Scenario: OS scheme changes while open
- **WHEN** System is selected and the operating system's color scheme
  changes from light to dark
- **THEN** the app switches to the dark theme without a reload and System
  stays selected

### Requirement: Default and remembered choice

A first visit, with no remembered choice, SHALL select System. The system
SHALL remember the admin's choice in the browser and restore it on later
loads, applying the remembered theme before the page first renders so the
other theme never shows briefly. When the browser cannot store the choice,
the control SHALL still work for the current page load and later loads
SHALL start from System.

#### Scenario: First visit
- **WHEN** an admin opens the app in a browser with no remembered choice
- **THEN** System is selected and the theme matches the operating system

#### Scenario: Choice survives a reload
- **WHEN** an admin chooses Dark on a system that prefers light and then
  reloads the page
- **THEN** Dark is still selected and the first rendered frame already uses
  the dark theme

#### Scenario: Storage unavailable
- **WHEN** the browser refuses to store the choice and the admin chooses
  Dark
- **THEN** the dark theme applies for that page load without an error

### Requirement: Theme covers the whole UI

The chosen theme SHALL apply to every screen, the header and navigation,
the user grid including its pagination controls, form controls, status and
error messages, and the edit conflict dialog. In the dark theme the
browser's native controls and scrollbars SHALL also use their dark
appearance.

#### Scenario: Grid and dialog follow the theme
- **WHEN** the dark theme is applied and an admin opens the user list and
  then the edit conflict dialog
- **THEN** the grid's rows, headers and pagination panel and the dialog all
  use dark backgrounds with light text

#### Scenario: Native controls follow the theme
- **WHEN** the dark theme is applied on the new user screen
- **THEN** the Role and Status selects render with the browser's dark
  appearance

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
