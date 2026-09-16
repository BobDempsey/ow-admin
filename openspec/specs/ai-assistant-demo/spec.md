# ai-assistant-demo Specification

## Purpose
Shows admins what an AI assistant in the admin UI could look like, through
a demo drawer opened from the header that links to a live example on
another site.

## Requirements

### Requirement: AI assistant button in the header

Every admin screen SHALL show an icon-only button in the header with the
accessible name "AI assistant", given by visually hidden text, and a
tooltip with the same words. Its icon SHALL be hidden from assistive
technology. The button SHALL be at least 44 by 44 CSS pixels and SHALL be
exposed to assistive technology as a button that opens a dialog. In
keyboard order it SHALL come after the nav entries and before the Theme
button.

#### Scenario: Button present on every screen
- **WHEN** an admin opens the user list, the new user screen, a user's
  detail screen, or the About screen at 1280 or 320 CSS pixels wide
- **THEN** the header shows the AI assistant button

#### Scenario: Button announced
- **WHEN** an assistive technology inspects the AI assistant button
- **THEN** it reports a button named "AI assistant" that opens a dialog,
  and its icon exposes no name of its own

#### Scenario: Tooltip matches the name
- **WHEN** an admin rests the pointer on the AI assistant button
- **THEN** the tooltip reads "AI assistant"

### Requirement: Demo drawer

Activating the AI assistant button SHALL open a modal drawer from the
right edge of the viewport, labelled by its "AI assistant" heading and
marked as a demo in visible text. The drawer SHALL show a fixed sample
conversation as a list, in which each message's speaker is available to
assistive technology. The drawer SHALL show a labelled message field that
is disabled and says in visible text that messaging is off in the demo.
The drawer SHALL NOT send any request.

#### Scenario: Drawer contents
- **WHEN** an admin opens the drawer
- **THEN** it shows the "AI assistant" heading, a "Demo" label, the sample
  conversation, the live example link and a disabled message field

#### Scenario: Speakers announced
- **WHEN** an assistive technology reads the sample conversation
- **THEN** each message starts with "You:" or "Assistant:"

#### Scenario: Message field disabled
- **WHEN** an assistive technology inspects the message field
- **THEN** it reports a text field named "Message" that is disabled

#### Scenario: No requests
- **WHEN** an admin opens the drawer and closes it
- **THEN** no request is sent to the API or to another site

### Requirement: Drawer focus and closing

Opening the drawer SHALL move focus to its heading, and focus SHALL stay
inside the drawer while it is open, with the content behind it not
reachable by pointer or Tab. Escape, the drawer's Close button and a
pointer click outside the drawer SHALL close it and return focus to the
AI assistant button. The Close button SHALL be an icon-only button named
"Close" through visually hidden text, with a matching tooltip, and at
least 44 by 44 CSS pixels.

#### Scenario: Focus on open
- **WHEN** an admin activates the AI assistant button
- **THEN** the drawer opens with focus on its heading, and pressing Tab
  repeatedly never moves focus to the page behind it

#### Scenario: Closing the drawer
- **WHEN** the drawer is open and an admin presses Escape, activates
  Close, or clicks outside it
- **THEN** the drawer closes, the screen does not change, and focus is on
  the AI assistant button

#### Scenario: Reduced motion
- **WHEN** the operating system asks for reduced motion and an admin opens
  the drawer
- **THEN** the drawer appears without a sliding transition

### Requirement: Live example link

The drawer SHALL contain a link with the visible text "View the live
example" that opens https://ai-storefront.bobdempsey83.com/ in a new tab
without giving that page access to the admin UI's window. The link's
accessible name SHALL say that it opens in a new tab, and it SHALL show an
external-link icon hidden from assistive technology.

#### Scenario: Link opens a new tab
- **WHEN** an admin activates "View the live example"
- **THEN** the live example opens in a new tab and the admin UI stays on
  its current screen with the drawer open

#### Scenario: New tab announced
- **WHEN** an assistive technology inspects the link
- **THEN** its name starts with "View the live example" and includes
  "(opens in a new tab)"

### Requirement: Accessible demo drawer

The open drawer SHALL meet the same accessibility checks as the rest of
the admin UI: no axe WCAG A or AA violations, contrast minimums in both
themes, visible focus, targets at least 24 by 24 CSS pixels, and no
sideways page scroll at 320 CSS pixels wide.

#### Scenario: Automated checks
- **WHEN** axe runs on the open drawer in the light and the dark theme at
  1280 and 320 CSS pixels wide
- **THEN** it reports no WCAG A or AA violations

#### Scenario: Narrow viewport
- **WHEN** the drawer is open at 320 CSS pixels wide
- **THEN** the heading, Close, the conversation, the link and the message
  field are reachable, nothing is cut off, and the page does not scroll
  sideways
