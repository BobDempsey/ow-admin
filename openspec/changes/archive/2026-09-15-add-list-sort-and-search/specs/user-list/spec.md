## ADDED Requirements

### Requirement: Sort by column

Each of the Name, Email, Role and Status column headers SHALL sort the list when activated with a pointer or the keyboard, cycling through ascending, descending and unsorted. Only one column SHALL sort at a time. Sorting SHALL be done by the API through the `sort` parameter, SHALL return the list to its first page, and each page SHALL still be fetched with its own request. The sorted header SHALL expose its direction to assistive technology and show it visually.

#### Scenario: Sort by clicking a header
- **WHEN** an admin clicks the Email column header
- **THEN** the screen requests `GET /users?skip=0&limit=25&sort=email:asc` and shows the first page in ascending email order

#### Scenario: Reverse and clear the sort
- **WHEN** an admin activates the sorted Email header a second and a third time
- **THEN** the list first sorts by email descending and then returns to the unsorted order, each time from the first page

#### Scenario: Sort with the keyboard
- **WHEN** an admin moves focus to the Role column header and presses Enter
- **THEN** the list sorts by role ascending

#### Scenario: Direction announced
- **WHEN** an assistive technology inspects the column headers while the list is sorted by name descending
- **THEN** the Name header reports a descending sort and the other headers report no sort

#### Scenario: Sort kept while paging
- **WHEN** the list is sorted by status ascending and an admin moves to the next page
- **THEN** the screen requests `GET /users?skip=25&limit=25&sort=status:asc`

### Requirement: Search by name or email

The user list screen SHALL show a search field above the grid with the visible label "Search users" and the placeholder "Name or email". Typing SHALL filter the list through the API's `q` parameter after the admin pauses typing, return the list to its first page, and keep the current sort. Clearing the field SHALL show all users again. When no user matches, the grid area SHALL say that no users match the search. The field SHALL be reachable by keyboard before the grid.

#### Scenario: Search narrows the list
- **WHEN** an admin types "lamport" in Search users and pauses
- **THEN** the screen requests `GET /users` with `q=lamport` and `skip=0`, and shows only users whose name or email contains "lamport"

#### Scenario: One request after typing
- **WHEN** an admin types "hopper" one character at a time without pausing
- **THEN** the screen sends one list request for "hopper", not one per character

#### Scenario: Label and placeholder
- **WHEN** an assistive technology inspects the search field
- **THEN** its accessible name is "Search users", and its placeholder "Name or email" is shown while the field is empty

#### Scenario: Clearing the search
- **WHEN** an admin clears the search field
- **THEN** the list shows all users from the first page and the total returns to the full user count

#### Scenario: No results
- **WHEN** an admin searches for text no user's name or email contains
- **THEN** the grid area says no users match the search, and the total reads 0

#### Scenario: Search keeps the sort
- **WHEN** the list is sorted by email descending and an admin searches for "turing"
- **THEN** the screen requests `q=turing` with `sort=email:desc` and the Email header still shows a descending sort

### Requirement: Search result announced

After a search or a cleared search loads, the screen SHALL announce the number of matching users through a status message, without moving focus from the search field.

#### Scenario: Match count announced
- **WHEN** a search for "lamport" finishes loading and the API's `total` is N
- **THEN** a status message reads "N users match", with N formatted with thousands separators, and focus stays in the search field

#### Scenario: No match announced
- **WHEN** a search finishes loading with no matches
- **THEN** a status message reads "No users match"

## MODIFIED Requirements

### Requirement: Total count displayed

The user list screen SHALL show the total number of users, sourced from the API response's `total` field. While a search is active, that number SHALL be the count of matching users, labeled so it reads as matches rather than all users.

#### Scenario: Total shown alongside page
- **WHEN** a page of users loads successfully
- **THEN** the screen displays the total user count returned by the API

#### Scenario: Total while searching
- **WHEN** a search for "lamport" loads
- **THEN** the screen shows the match count from the API's `total`, worded as matching users, in place of the full user count
