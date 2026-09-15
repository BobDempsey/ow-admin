## Purpose

Lets an admin choose a light or dark appearance for the admin UI, or follow the operating system's color scheme, and keeps that choice across visits in the same browser.

## ADDED Requirements

### Requirement: Theme control in the header

Every admin screen SHALL show a theme control in the header with three choices, Light, Dark and System, of which exactly one is selected. The choices SHALL be grouped under the accessible name "Theme", the selected choice SHALL be exposed to assistive technology and shown by more than color alone, and the control SHALL be operable by keyboard.

#### Scenario: Control present on every screen
- **WHEN** an admin opens the user list, the new user screen, a user's detail screen, or the About screen
- **THEN** the header shows the Theme control with Light, Dark and System, and one of them is selected

#### Scenario: Choosing by keyboard
- **WHEN** an admin moves focus to the Theme control and uses the arrow keys to select Dark
- **THEN** Dark becomes the selected choice and the dark theme applies without a page reload

#### Scenario: Selected choice announced
- **WHEN** an assistive technology inspects the Theme control
- **THEN** it reports a group named "Theme" containing three choices, with the selected one marked as checked

### Requirement: Applying the chosen theme

Choosing Light or Dark SHALL apply that theme whatever the operating system's color scheme. Choosing System SHALL apply the theme matching the operating system's color scheme, and SHALL switch themes when that scheme changes while the app is open.

#### Scenario: Explicit choice overrides the OS
- **WHEN** the operating system prefers dark and the admin chooses Light
- **THEN** the app shows the light theme

#### Scenario: System follows the OS
- **WHEN** System is selected and the operating system prefers dark
- **THEN** the app shows the dark theme

#### Scenario: OS scheme changes while open
- **WHEN** System is selected and the operating system's color scheme changes from light to dark
- **THEN** the app switches to the dark theme without a reload and System stays selected

### Requirement: Default and remembered choice

A first visit, with no remembered choice, SHALL select System. The system SHALL remember the admin's choice in the browser and restore it on later loads, applying the remembered theme before the page first renders so the other theme never shows briefly. When the browser cannot store the choice, the control SHALL still work for the current page load and later loads SHALL start from System.

#### Scenario: First visit
- **WHEN** an admin opens the app in a browser with no remembered choice
- **THEN** System is selected and the theme matches the operating system

#### Scenario: Choice survives a reload
- **WHEN** an admin chooses Dark on a system that prefers light and then reloads the page
- **THEN** Dark is still selected and the first rendered frame already uses the dark theme

#### Scenario: Storage unavailable
- **WHEN** the browser refuses to store the choice and the admin chooses Dark
- **THEN** the dark theme applies for that page load without an error

### Requirement: Theme covers the whole UI

The chosen theme SHALL apply to every screen, the header and navigation, the user grid including its pagination controls, form controls, status and error messages, and the edit conflict dialog. In the dark theme the browser's native controls and scrollbars SHALL also use their dark appearance.

#### Scenario: Grid and dialog follow the theme
- **WHEN** the dark theme is applied and an admin opens the user list and then the edit conflict dialog
- **THEN** the grid's rows, headers and pagination panel and the dialog all use dark backgrounds with light text

#### Scenario: Native controls follow the theme
- **WHEN** the dark theme is applied on the new user screen
- **THEN** the Role and Status selects render with the browser's dark appearance
