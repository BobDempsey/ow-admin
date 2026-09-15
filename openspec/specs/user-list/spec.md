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
rather than all users.

#### Scenario: Total shown alongside page
- **WHEN** a page of users loads successfully
- **THEN** the screen displays the total user count returned by the API

#### Scenario: Total while searching
- **WHEN** a search for "lamport" loads
- **THEN** the screen shows the match count from the API's `total`, worded
  as matching users, in place of the full user count

### Requirement: Navigate to user detail

The user list screen SHALL let an admin open an individual user's detail
view from the list, with a pointer or with the keyboard alone.

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

### Requirement: User columns

The user list SHALL show each user's name, email, role and status in its
own labeled column. Status SHALL be shown as text, so it does not depend on
color alone.

#### Scenario: Row content
- **WHEN** a page of users loads
- **THEN** each row shows the user's name, email, role and status under
  column headers named Name, Email, Role and Status

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

While a page request is in flight, the user list SHALL show that users are
loading and SHALL announce it to assistive technology through a polite live
region.

#### Scenario: Page in flight
- **WHEN** an admin moves to a page whose request has not yet answered
- **THEN** the screen shows a loading indicator and a status message saying
  users are loading

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

### Requirement: Search result announced

After a search or a cleared search loads, the screen SHALL announce the
number of matching users through a status message, without moving focus
from the search field.

#### Scenario: Match count announced
- **WHEN** a search for "lamport" finishes loading and the API's `total` is
  N
- **THEN** a status message reads "N users match", with N formatted with
  thousands separators, and focus stays in the search field

#### Scenario: No match announced
- **WHEN** a search finishes loading with no matches
- **THEN** a status message reads "No users match"
