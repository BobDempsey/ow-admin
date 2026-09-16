# admin-navigation Specification

## Purpose
Gives admins a consistent top navigation bar and a way to reach the user
management screen from anywhere in the admin UI.

## Requirements

### Requirement: Top navigation bar

The system SHALL display a top navigation bar on every admin screen.

#### Scenario: Nav bar present on load
- **WHEN** an admin loads any admin screen
- **THEN** the top navigation bar is visible

### Requirement: Link to user management

The top navigation bar SHALL include at least one entry that navigates to
the user management screen.

#### Scenario: Navigate to user management
- **WHEN** an admin activates the user management nav entry
- **THEN** the user management screen loads

### Requirement: Current screen indicated

The top navigation bar SHALL mark the entry for the current screen with
`aria-current="page"` and SHALL show a visible indicator for it that does
not depend on color alone.

#### Scenario: Users entry marked current
- **WHEN** an admin is on the user management screen
- **THEN** the user management nav entry has `aria-current="page"` and a
  visible non-color indicator, and no other entry has `aria-current`

#### Scenario: About entry marked current
- **WHEN** an admin is on the About screen
- **THEN** the About nav entry has `aria-current="page"` and a visible
  non-color indicator, and no other entry has `aria-current`

### Requirement: Skip to main content

Every admin screen SHALL start with a skip link, visible when focused, that
moves keyboard focus past the navigation to the main content.

#### Scenario: Skip link used
- **WHEN** a keyboard user presses Tab once on page load and activates the
  skip link
- **THEN** focus moves to the main content region, bypassing the nav
  entries

### Requirement: Document title per screen

Each admin screen SHALL set the document title to the screen's name
followed by `| OW Admin`.

#### Scenario: Title on the user management screen
- **WHEN** the user management screen loads
- **THEN** the document title is `Users | OW Admin`

### Requirement: Default route

Loading the application root or an unknown path SHALL show the user
management screen.

#### Scenario: Root URL
- **WHEN** an admin opens `/`
- **THEN** the URL becomes `/users` and the user management screen loads

#### Scenario: Unknown URL
- **WHEN** an admin opens a path no screen handles
- **THEN** the URL becomes `/users` and the user management screen loads

### Requirement: Navigation reflows at narrow widths

The top navigation SHALL remain fully usable at a viewport 320 CSS pixels
wide, with every entry reachable without horizontal scrolling, through the
drawer described in "Navigation drawer on narrow screens".

#### Scenario: Narrow viewport
- **WHEN** the viewport is 320 CSS pixels wide
- **THEN** every nav entry is reachable through the Menu button's drawer,
  the open drawer fits the viewport, and the page does not scroll
  horizontally

### Requirement: Unavailable nav entries

Nav entries other than user management and About SHALL be rendered as
non-functional placeholders that do not navigate or error when activated.
Each placeholder SHALL stay keyboard-focusable and SHALL be exposed to
assistive technology as unavailable.

#### Scenario: Placeholder entry does not navigate
- **WHEN** an admin activates a placeholder nav entry
- **THEN** the system does not navigate away from the current screen and
  does not error

#### Scenario: Placeholder entry announced as unavailable
- **WHEN** an assistive technology inspects a placeholder nav entry
- **THEN** the entry reports itself as disabled and its accessible name
  says the screen is not available yet

#### Scenario: Settings is a placeholder
- **WHEN** an admin activates the Settings nav entry
- **THEN** no dialog opens, the screen does not change, and the entry is
  reported as unavailable like Dashboard and Reports

### Requirement: Navigation drawer on narrow screens

Below a viewport width of 768 CSS pixels, the top navigation bar SHALL
show an icon-only button with the accessible name "Menu" in place of the
nav entries, and SHALL keep the wordmark, the AI assistant button and the
theme control in the bar. The Menu button SHALL be named through visually
hidden text, SHALL show a tooltip reading "Menu", SHALL hide its icon from
assistive technology, and SHALL be at least 44 by 44 CSS pixels.
Activating the button SHALL open a drawer holding every nav entry in the
same order as the wide layout, with the same links, placeholders and
current-screen marking. The drawer SHALL be modal: while it is open, focus
SHALL stay inside it and the content behind it SHALL NOT be reachable by
pointer or Tab. Opening SHALL move focus into the drawer; activating an
entry that navigates SHALL close the drawer and leave focus handling to
the new screen; Escape, the drawer's Close button and a pointer click
outside the drawer SHALL close it and return focus to the Menu button. The
Close button SHALL be an icon-only button beside the drawer's heading,
named "Close" through visually hidden text, with a matching tooltip.
Activating the entry for the screen already shown SHALL also close the
drawer and return focus to the Menu button, without reloading the screen.
If the viewport reaches 768 CSS pixels or wider while the drawer is open,
the drawer SHALL close and focus SHALL move to the wordmark link. At 768
CSS pixels and wider, the entries SHALL be shown in the bar and no Menu
button SHALL be present.

#### Scenario: Menu button replaces the entries
- **WHEN** an admin loads any screen at 320 CSS pixels wide
- **THEN** the header shows the wordmark, the AI assistant button, the
  theme control and a Menu button, and no nav entry is shown in the bar

#### Scenario: Menu button announced
- **WHEN** an assistive technology inspects the Menu button at 320 CSS
  pixels wide
- **THEN** it reports a button named "Menu" that opens a dialog, and its
  icon exposes no name of its own

#### Scenario: Drawer holds every entry
- **WHEN** an admin opens the drawer at 320 CSS pixels wide
- **THEN** it lists the same entries in the same order as the wide header,
  with placeholders still reported as unavailable

#### Scenario: Navigating from the drawer
- **WHEN** an admin opens the drawer on the About screen and activates the
  Users entry
- **THEN** the user list loads, the drawer is closed, and focus is on the
  new screen's heading

#### Scenario: Current screen marked in the drawer
- **WHEN** an admin on the user list opens the drawer
- **THEN** the Users entry has `aria-current="page"` and a visible
  non-color indicator, and no other entry has `aria-current`

#### Scenario: Closing the drawer
- **WHEN** the drawer is open and an admin presses Escape, activates
  Close, or clicks outside it
- **THEN** the drawer closes, the screen does not change, and focus is on
  the Menu button

#### Scenario: Choosing the current screen
- **WHEN** an admin on the user list opens the drawer and activates the
  Users entry with a pointer or with Enter
- **THEN** the drawer closes, the user list stays as it was, and focus is
  on the Menu button

#### Scenario: Viewport widens while the drawer is open
- **WHEN** the drawer is open at 320 CSS pixels wide and the viewport
  widens to 1024 CSS pixels
- **THEN** the drawer closes, the entries show in the bar, focus is on the
  wordmark link, and the controls on the screen respond to the pointer

#### Scenario: Focus stays in the open drawer
- **WHEN** the drawer is open and an admin presses Tab repeatedly
- **THEN** focus cycles through the drawer's controls and never reaches
  the page behind it

#### Scenario: Wide layout unchanged
- **WHEN** the viewport is 1280 CSS pixels wide
- **THEN** every nav entry is shown in the header bar and no Menu button is
  present

### Requirement: Header order

The header SHALL show, from left to right and in the same keyboard order:
the wordmark, the nav entries, the AI assistant button, the Theme button,
and, below a viewport width of 768 CSS pixels, the Menu button. The
wordmark and the nav entries SHALL sit inside the `nav` landmark named
"Primary"; the AI assistant, Theme and Menu buttons SHALL sit outside it.
The AI assistant and Theme buttons SHALL sit at the right end of the row.

#### Scenario: Wide header order
- **WHEN** an admin tabs through the header at 1280 CSS pixels wide after
  the skip link
- **THEN** focus reaches the wordmark, each nav entry in order, AI
  assistant, and Theme, and no Menu button

#### Scenario: Narrow header order
- **WHEN** an admin tabs through the header at 320 CSS pixels wide after
  the skip link
- **THEN** focus reaches the wordmark, AI assistant, Theme and Menu in
  that order, and the three buttons sit in that order at the right end of
  the row

#### Scenario: Menu outside the Primary landmark
- **WHEN** an assistive technology lists the controls inside the `nav`
  landmark named "Primary" at 320 CSS pixels wide
- **THEN** it finds the wordmark and not the Menu, Theme or AI assistant
  buttons

### Requirement: Dark header in both themes

The header SHALL use a dark background in both the light and the dark
theme, drawn from the `header-*` color tokens. In both themes, header text
and placeholder entries SHALL meet 4.5:1 against the header background and
against its hover fill where they show on it, and icons, the focus ring
and the current-entry underline SHALL meet 3:1.

#### Scenario: Dark in the light theme
- **WHEN** the light theme is applied and an admin opens any screen
- **THEN** the header background is dark and the page below it is light

#### Scenario: Header contrast
- **WHEN** the header's text, placeholder, icon, focus ring and underline
  colors are measured in the light and the dark theme
- **THEN** each pair meets its minimum
