# user-list Specification

## Purpose
Lets admins browse the full user base at scale (up to 500,000 users)
without ever loading or rendering the full set at once.

## Requirements

### Requirement: Server-side paginated list

The user list screen SHALL display users using server-side pagination
against the `user-api-client` `GET /users` endpoint (`skip`/`limit`), never
by loading the full user set and slicing it on the client. Each page SHALL
be fetched with its own `GET /users` request whose `limit` is the page size
and whose `skip` is the zero-based page index times the page size.

#### Scenario: Initial page load
- **WHEN** an admin opens the user list screen
- **THEN** the screen requests a single page of users via `GET /users`
  rather than fetching all users

#### Scenario: Navigate to next page
- **WHEN** an admin moves to the next page of results
- **THEN** the screen issues a new `GET /users` request with an updated
  `skip` value instead of slicing already-fetched data

#### Scenario: Page request matches the page shown
- **WHEN** the page size is 25 and an admin moves to the third page
- **THEN** the screen requests `GET /users?skip=50&limit=25` and shows the
  users at offsets 50 through 74

### Requirement: Total count displayed

The user list screen SHALL show the total number of users, sourced from
the API response's `total` field. While a search is active, that number
SHALL be the count of matching users, labeled so it reads as matches
rather than all users. A count of exactly 1 SHALL use the singular ("1
user", "1 user matches"); every other count, including 0, SHALL use the
plural. The count SHALL be shown visibly in one place only, beside the
screen heading.

#### Scenario: Total shown alongside page
- **WHEN** a page of users loads successfully
- **THEN** the screen displays the total user count returned by the API

#### Scenario: Total while searching
- **WHEN** a search for "lamport" loads
- **THEN** the screen shows the match count from the API's `total`, worded
  as matching users, in place of the full user count

#### Scenario: Single match
- **WHEN** a search loads and the API's `total` is 1
- **THEN** the total beside the heading reads "1 user matches"

#### Scenario: Count shown once
- **WHEN** a search finishes loading
- **THEN** the match count is visible beside the heading and nowhere else
  on the screen

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

### Requirement: Page size choice

The user list SHALL let an admin choose a page size of 25, 50 or 100 users,
SHALL default to 25, and SHALL return to the first page when the page size
changes.

#### Scenario: Default page size
- **WHEN** an admin opens the user list screen
- **THEN** the first request is `GET /users?skip=0&limit=25` and the page
  shows up to 25 users

#### Scenario: Change page size
- **WHEN** an admin on a later page changes the page size to 50
- **THEN** the screen shows the first page and requests
  `GET /users?skip=0&limit=50`

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

### Requirement: Load failure with retry

When a page request fails, the user list SHALL show an error message
announced to assistive technology, and SHALL offer a keyboard-operable
action that retries the failed page.

#### Scenario: Page request fails
- **WHEN** `GET /users` answers with an error status
- **THEN** the screen shows a message saying the users could not be loaded,
  announced as an alert, with a Try again button

#### Scenario: Retry succeeds
- **WHEN** an admin activates Try again and the new request succeeds
- **THEN** the error message goes away and the page shows the loaded users

### Requirement: New user entry point

The user list screen SHALL offer a keyboard-operable New user control that
opens the create screen at `/users/new`.

#### Scenario: Open the create screen from the list
- **WHEN** an admin activates New user on the user list screen
- **THEN** the system navigates to `/users/new` and focus moves to that
  screen's heading

#### Scenario: New user control is a named link
- **WHEN** an assistive technology inspects the New user control
- **THEN** it is exposed as a link named "New user" whose target is
  `/users/new`

### Requirement: Sort by column

Each of the Name, Email, Role and Status column headers SHALL sort the list
when activated with a pointer or the keyboard, cycling through ascending,
descending and unsorted. Only one column SHALL sort at a time. Sorting
SHALL be done by the API through the `sort` parameter, SHALL return the
list to its first page, and each page SHALL still be fetched with its own
request. The sorted header SHALL expose its direction to assistive
technology and show it visually.

#### Scenario: Sort by clicking a header
- **WHEN** an admin clicks the Email column header
- **THEN** the screen requests `GET /users?skip=0&limit=25&sort=email:asc`
  and shows the first page in ascending email order

#### Scenario: Reverse and clear the sort
- **WHEN** an admin activates the sorted Email header a second and a third
  time
- **THEN** the list first sorts by email descending and then returns to the
  unsorted order, each time from the first page

#### Scenario: Sort with the keyboard
- **WHEN** an admin moves focus to the Role column header and presses Enter
- **THEN** the list sorts by role ascending

#### Scenario: Direction announced
- **WHEN** an assistive technology inspects the column headers while the
  list is sorted by name descending
- **THEN** the Name header reports a descending sort and the other headers
  report no sort

#### Scenario: Sort kept while paging
- **WHEN** the list is sorted by status ascending and an admin moves to the
  next page
- **THEN** the screen requests `GET /users?skip=25&limit=25&sort=status:asc`

### Requirement: Search by name or email

The user list screen SHALL show a search field above the grid with the
visible label "Search users" and the placeholder "Name or email". Typing
SHALL filter the list through the API's `q` parameter after the admin
pauses typing, return the list to its first page, and keep the current
sort. Clearing the field SHALL show all users again. When no user matches,
the grid area SHALL say that no users match the search. The field SHALL be
reachable by keyboard before the grid.

#### Scenario: Search narrows the list
- **WHEN** an admin types "lamport" in Search users and pauses
- **THEN** the screen requests `GET /users` with `q=lamport` and `skip=0`,
  and shows only users whose name or email contains "lamport"

#### Scenario: One request after typing
- **WHEN** an admin types "hopper" one character at a time without pausing
- **THEN** the screen sends one list request for "hopper", not one per
  character

#### Scenario: Label and placeholder
- **WHEN** an assistive technology inspects the search field
- **THEN** its accessible name is "Search users", and its placeholder "Name
  or email" is shown while the field is empty

#### Scenario: Clearing the search
- **WHEN** an admin clears the search field
- **THEN** the list shows all users from the first page and the total
  returns to the full user count

#### Scenario: No results
- **WHEN** an admin searches for text no user's name or email contains
- **THEN** the grid area says no users match the search, and the total
  reads 0

#### Scenario: Search keeps the sort
- **WHEN** the list is sorted by email descending and an admin searches for
  "turing"
- **THEN** the screen requests `q=turing` with `sort=email:desc` and the
  Email header still shows a descending sort

### Requirement: Density change reloads quietly

When the admin changes Density in Table settings, the user list SHALL re-lay the
current page at the new row height without showing or announcing "Loading
users…" and without clearing a search result announcement. The page
number, sort and search SHALL stay as they were. A failed reload SHALL
still show the error with Try again. Every other list load (paging,
sorting, searching, Try again) SHALL keep showing "Loading users…".

#### Scenario: No loading message on density change
- **WHEN** the list has loaded and an admin selects Compact in Table settings
- **THEN** rows change to the Compact height, the page number stays the
  same, and the status region never shows "Loading users…"

#### Scenario: Paging still shows loading
- **WHEN** an admin moves to the next page
- **THEN** the status region shows "Loading users…" until the page loads

#### Scenario: Failed density reload
- **WHEN** the request made for a density change fails
- **THEN** the error with Try again is shown

### Requirement: Filter by role and status

The user list screen SHALL show two dropdowns beside the Search users
field, with the visible labels "Role" and "Status". Role SHALL offer "Any
role", Admin, Member and Viewer; Status SHALL offer "Any status", active,
invited and suspended, written the way the list's columns show them. Both
SHALL start on their "Any" option. Choosing an option SHALL filter the
list through the API's `role` or `status` parameter without waiting,
return the list to its first page, and keep the current sort and search.
Choosing an "Any" option SHALL remove that filter. In keyboard order the
dropdowns SHALL come after the search field and before the grid. When no
user matches, the grid area SHALL say that no users match the search or
filters.

#### Scenario: Filter by status
- **WHEN** an admin chooses suspended in Status
- **THEN** the screen requests `GET /users` with `status=suspended` and
  `skip=0`, and every row's status reads suspended

#### Scenario: Filters combine with search
- **WHEN** an admin has searched for "hopper" and chooses Admin in Role
- **THEN** the screen requests `q=hopper` with `role=Admin`, and every row
  is an admin whose name or email contains "hopper"

#### Scenario: Filter keeps the sort
- **WHEN** the list is sorted by email descending and an admin chooses
  Viewer in Role
- **THEN** the screen requests `role=Viewer` with `sort=email:desc` and the
  Email header still shows a descending sort

#### Scenario: Clearing a filter
- **WHEN** an admin has chosen Admin in Role and then chooses Any role
- **THEN** the list requests no `role` parameter and shows users of every
  role from the first page

#### Scenario: Labels
- **WHEN** an assistive technology inspects the two dropdowns
- **THEN** their accessible names are "Role" and "Status"

#### Scenario: No results
- **WHEN** an admin's search and filters match no user
- **THEN** the grid area says no users match the search or filters, and
  the total reads 0

### Requirement: Filter results worded as matches

While a role or status filter is active, with or without a search, the
total and the status message that follows a load SHALL use the same
wording as for a search: the total SHALL read as matching users, and after
a filter change loads the screen SHALL announce the match count, or that no
users match, without moving focus from the dropdown.

#### Scenario: Match count after a filter change
- **WHEN** an admin chooses invited in Status and the list finishes loading
  with a `total` of N
- **THEN** the total reads as N users matching, a status message announces
  the same count, and focus stays on the Status dropdown

#### Scenario: Removing the last filter
- **WHEN** no search is active and an admin sets the only active filter
  back to its "Any" option
- **THEN** the total returns to the full user count, worded as users rather
  than matches

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
