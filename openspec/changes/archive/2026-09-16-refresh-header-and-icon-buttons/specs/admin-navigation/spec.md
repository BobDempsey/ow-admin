## ADDED Requirements

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

## MODIFIED Requirements

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
