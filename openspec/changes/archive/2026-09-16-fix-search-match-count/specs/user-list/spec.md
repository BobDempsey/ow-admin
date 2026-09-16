## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Search result announced

After a search or a cleared search loads, the screen SHALL announce the
number of matching users through a status message, without moving focus
from the search field. The announcement SHALL be available to assistive
technology but visually hidden, since the total beside the heading already
shows the count. The loading message in the same status region SHALL stay
visible.

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

#### Scenario: Loading stays visible
- **WHEN** a list request is in flight
- **THEN** the status region shows "Loading users…" on screen
