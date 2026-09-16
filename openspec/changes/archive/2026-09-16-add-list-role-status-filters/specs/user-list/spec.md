## ADDED Requirements

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
