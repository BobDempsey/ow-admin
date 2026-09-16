## MODIFIED Requirements

### Requirement: Navigate to user detail

The user list screen SHALL let an admin open an individual user's detail
view from the list, with a pointer or with the keyboard alone. A pointer
click anywhere in a row SHALL open the user, except on the row's Actions
button. Enter SHALL open the user from any cell of the row except the
Actions cell, where Enter opens the row's Actions menu instead.

#### Scenario: Open a user from the list
- **WHEN** an admin selects a user row in the list
- **THEN** the system navigates to that user's view/edit screen

#### Scenario: Open a user with the keyboard
- **WHEN** an admin moves keyboard focus to a user row and presses Enter
- **THEN** the system navigates to that user's view/edit screen at
  `/users/{id}`

#### Scenario: User name is a link
- **WHEN** an assistive technology inspects the name cell of a user row
- **THEN** the cell contains a link whose accessible name is the user's
  name and whose target is `/users/{id}`

#### Scenario: Enter on the Actions cell
- **WHEN** an admin moves focus to a row's Actions cell and presses Enter
- **THEN** the row's Actions menu opens and the screen does not change

#### Scenario: Clicking the Actions button
- **WHEN** an admin clicks a row's Actions button
- **THEN** the row's Actions menu opens and the screen does not change

### Requirement: User columns

The user list SHALL show each user's name, email, role and status in its
own labeled column, followed by an Actions column. Status SHALL be shown
as a colored pill that contains the status word (active, invited or
suspended), with a different color for each status, so the meaning never
depends on color alone. Role SHALL be shown as a neutral pill that
contains the role name. Each name SHALL follow a circle holding the
user's initials, colored from a fixed set; the circle SHALL be hidden from
assistive technology, so the name is announced once. The initials SHALL be
the first letter of the name's first word and of its last word, in
capitals, or one letter for a one-word name. A user's circle SHALL keep
the same color on every page and every load. The text in every pill and
circle SHALL meet 4.5:1 against the fill behind it in both themes.

#### Scenario: Row content
- **WHEN** a page of users loads
- **THEN** each row shows the user's name, email, role and status under
  column headers named Name, Email, Role and Status, followed by an
  Actions column

#### Scenario: Status word inside the pill
- **WHEN** a page of users loads that includes an active, an invited and
  a suspended user
- **THEN** each Status cell shows a pill containing the word active,
  invited or suspended, and the three pills have different fill colors

#### Scenario: Role pill
- **WHEN** a page of users loads
- **THEN** each Role cell shows a pill containing Admin, Member or Viewer,
  with the same neutral fill for every role

#### Scenario: Initials beside the name
- **WHEN** a row for Radia Lamport is shown
- **THEN** a circle reading "RL" sits before the name link, and an
  assistive technology reading the cell finds the name once and no
  initials

#### Scenario: Same color on every load
- **WHEN** an admin views a user's row, moves to another page and back
- **THEN** the user's initials circle has the same color both times

### Requirement: Loading state

While a page request is in flight, the user list SHALL show placeholder
rows shaped like user rows in place of the page's rows, and SHALL
announce that users are loading through a polite live region. The
placeholder shapes SHALL be hidden from assistive technology, so a
placeholder row exposes no text. They SHALL NOT animate while the
operating system asks for reduced motion. They SHALL go away when the
page loads, and SHALL NOT be shown beside a load failure.

#### Scenario: Page in flight
- **WHEN** an admin moves to a page whose request has not yet answered
- **THEN** the screen shows placeholder rows and a status message saying
  users are loading

#### Scenario: Reduced motion
- **WHEN** the operating system asks for reduced motion and a page is
  loading
- **THEN** the placeholder rows are shown without any animation

#### Scenario: No placeholders beside a failure
- **WHEN** a page request fails
- **THEN** the error with Try again is shown and no placeholder row is
  shown

## REMOVED Requirements

### Requirement: Search result announced
**Reason**: Skeleton rows now show that a page is loading, so the "Loading
users…" text in the status region becomes visually hidden, which the
"Loading stays visible" scenario forbids.
**Migration**: See "Result and loading announcements", which keeps every
other rule of this requirement.

## ADDED Requirements

### Requirement: Result and loading announcements

After a search, a cleared search or a filter change loads, the screen
SHALL announce the number of matching users through a status message,
without moving focus from the control the admin used. While a list
request is in flight, the same status region SHALL say "Loading users…".
Both messages SHALL be available to assistive technology but visually
hidden, since the total beside the heading shows the count and the
placeholder rows show the loading.

#### Scenario: Match count announced
- **WHEN** a search for "lamport" finishes loading and the API's `total` is
  N
- **THEN** a status message reads "N users match", with N formatted with
  thousands separators, and focus stays in the search field

#### Scenario: Single match announced
- **WHEN** a search finishes loading and the API's `total` is 1
- **THEN** a status message reads "1 user matches"

#### Scenario: No match announced
- **WHEN** a search finishes loading with no matches
- **THEN** a status message reads "No users match"

#### Scenario: Announcement not shown on screen
- **WHEN** a search result announcement is in the status region
- **THEN** its text is visually hidden while still exposed to assistive
  technology

#### Scenario: Loading announced but not shown
- **WHEN** a list request is in flight
- **THEN** the status region contains "Loading users…", visually hidden
  and exposed to assistive technology

### Requirement: Active filter chips

While a search, a role filter or a status filter is active, the user list
SHALL show one chip for each active filter, below the filter controls,
labeled with the filter's name and value: "Search: {text}", "Role:
{role}" and "Status: {status}", in that order, where the search text is
the search the list last applied. After the chips it SHALL show a "Clear
all" button. Each chip SHALL be a button whose accessible name is "Remove
filter" followed by its visible label. Activating a chip SHALL remove that filter
at once; for the search chip that means emptying the Search users field
without waiting for a typing pause. Clear all SHALL remove every active
filter with a single list request. Both SHALL return the list to its first
page, keep the current sort, and announce the result the way a filter
change does. After a chip is removed, focus SHALL move to the chip that
took its place, or to the new last chip when it was last, or to the
Search users field when no chip remains. After Clear all, focus SHALL move
to the Search users field. With no active filter, no chip and no Clear
all SHALL be shown. In keyboard order the chips and Clear all SHALL come
after Table settings and before the grid.

#### Scenario: Chips for active filters
- **WHEN** an admin searches for "hopper" and chooses Admin in Role
- **THEN** chips labeled "Search: hopper" and "Role: Admin" are shown,
  followed by Clear all

#### Scenario: Chip accessible names
- **WHEN** an assistive technology inspects the chips while Role is Admin
  and Status is suspended
- **THEN** it finds buttons named "Remove filter Role: Admin" and "Remove
  filter Status: suspended"

#### Scenario: Removing a chip
- **WHEN** Role is Admin and Status is suspended, and an admin activates
  the Role chip
- **THEN** the screen requests `GET /users` with `status=suspended`, no
  `role` and `skip=0`, Role shows "Any role", and focus is on the Status
  chip

#### Scenario: Removing the search chip
- **WHEN** a search for "hopper" is active and an admin activates its chip
- **THEN** the Search users field is empty, the list requests no `q`
  without waiting for a typing pause, and focus is on the Search users
  field when no other chip remains

#### Scenario: Removing the last chip in the row
- **WHEN** a search and a role filter are active and an admin activates
  the Role chip
- **THEN** focus moves to the Search chip

#### Scenario: Clear all
- **WHEN** a search, a role filter and a status filter are active and an
  admin activates Clear all
- **THEN** the list sends one request with no `q`, `role` or `status`,
  the search field is empty, both dropdowns show their "Any" option, the
  chips and Clear all are gone, the total reads as all users, and focus
  is on the Search users field

#### Scenario: Sort kept
- **WHEN** the list is sorted by email descending with Role set to Viewer,
  and an admin activates Clear all
- **THEN** the request carries `sort=email:desc` and the Email header
  still shows a descending sort

#### Scenario: No chips without filters
- **WHEN** the user list loads with no search and both dropdowns on their
  "Any" option
- **THEN** no chip and no Clear all button is shown

### Requirement: Empty result state

When a loaded page has no users and a search or filter is active, the
grid area SHALL show a heading "No users match", one line of help saying
to try a different search or filter, and a "Clear filters" button.
Clear filters SHALL do what Clear all does, including moving focus to the
Search users field. The Clear filters button SHALL be reachable with Tab.
When no search or filter is active and the API's `total` is 0, the grid
area SHALL show a heading "No users yet" and no Clear filters button.

#### Scenario: Nothing matches
- **WHEN** an admin searches for text no user's name or email contains
- **THEN** the grid area shows the heading "No users match", a line of
  help, and a Clear filters button, and the total reads 0

#### Scenario: Clear filters
- **WHEN** the empty state is shown after a search and a status filter,
  and an admin activates Clear filters
- **THEN** the list shows all users from the first page, the search field
  is empty, Status shows "Any status", and focus is on the Search users
  field

#### Scenario: Clear filters from the keyboard
- **WHEN** the empty state is shown and an admin presses Tab from the
  Search users field until Clear filters has focus, then presses Enter
- **THEN** focus reaches Clear filters and the filters are cleared

#### Scenario: No users at all
- **WHEN** no search or filter is active and the API answers with a
  `total` of 0
- **THEN** the grid area shows the heading "No users yet" and no Clear
  filters button

### Requirement: Row actions menu

Each user row's Actions cell SHALL hold a button named "Actions for
{name}" that is exposed as opening a menu and reports whether the menu is
open. The menu SHALL hold two items, View and Reset password, in that
order. View SHALL open the user's detail screen at `/users/{id}`. Reset
password SHALL start the reset described in the `password-reset`
requirement "Trigger password reset from the user list". The grid SHALL
stay a single Tab stop: the Actions button SHALL NOT be a Tab stop of its
own, and an admin SHALL reach it by moving focus to the row's Actions
cell with the arrow keys. Enter or Space on the Actions cell, or a pointer
click on the button, SHALL open the menu with focus on View. While the
menu is open, Down Arrow and Up Arrow SHALL move focus to the next and
previous item, wrapping at either end, Home and End SHALL move focus to
the first and last item, and Enter or Space SHALL activate the focused
item. Escape and Tab SHALL close the menu and return focus to the row's
Actions cell. A pointer click outside the menu SHALL close it. The menu
SHALL stay within the viewport, SHALL NOT cover its button, and each item
SHALL be at least 24 by 24 CSS pixels.

#### Scenario: Button announced
- **WHEN** an assistive technology inspects the Actions button in Radia
  Lamport's row while its menu is closed
- **THEN** it reports a button named "Actions for Radia Lamport" that
  opens a menu and is collapsed

#### Scenario: Open by keyboard
- **WHEN** an admin tabs into the grid, moves focus with the arrow keys to
  a row's Actions cell, and presses Enter
- **THEN** a menu opens with View and Reset password, focus is on View,
  and the Actions button reports it is expanded

#### Scenario: Move and choose by keyboard
- **WHEN** the menu is open with focus on View and an admin presses Down
  Arrow and then Enter
- **THEN** the menu closes and the password reset confirmation for that
  row's user opens

#### Scenario: View
- **WHEN** an admin opens the menu in the row for `u-000042` and activates
  View
- **THEN** the system navigates to `/users/u-000042` and focus moves to
  that screen's heading

#### Scenario: Escape closes the menu
- **WHEN** the menu is open and an admin presses Escape
- **THEN** the menu closes, the screen does not change, and focus is on
  the row's Actions cell

#### Scenario: Tab closes the menu
- **WHEN** the menu is open and an admin presses Tab
- **THEN** the menu closes and focus is on the row's Actions cell, so a
  further Tab leaves the grid

#### Scenario: Click outside
- **WHEN** the menu is open and an admin clicks the page heading
- **THEN** the menu closes and the screen does not change

#### Scenario: Menu fits a narrow screen
- **WHEN** the menu is open for the last row of a page at 320 CSS pixels
  wide
- **THEN** both items are fully visible, each is at least 24 by 24 CSS
  pixels, the Actions button is not covered, and the page does not scroll
  sideways
