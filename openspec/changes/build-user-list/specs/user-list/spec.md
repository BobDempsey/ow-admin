## MODIFIED Requirements

### Requirement: Server-side paginated list

The user list screen SHALL display users using server-side pagination against the `user-api-client` `GET /users` endpoint (`skip`/`limit`), never by loading the full user set and slicing it on the client. Each page SHALL be fetched with its own `GET /users` request whose `limit` is the page size and whose `skip` is the zero-based page index times the page size.

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
- **THEN** the screen requests `GET /users?skip=50&limit=25` and shows the users at offsets 50 through 74

### Requirement: Navigate to user detail

The user list screen SHALL let an admin open an individual user's detail view from the list, with a pointer or with the keyboard alone.

#### Scenario: Open a user from the list
- **WHEN** an admin selects a user row in the list
- **THEN** the system navigates to that user's view/edit screen

#### Scenario: Open a user with the keyboard
- **WHEN** an admin moves keyboard focus to a user row and presses Enter
- **THEN** the system navigates to that user's view/edit screen at `/users/{id}`

#### Scenario: User name is a link
- **WHEN** an assistive technology inspects the name cell of a user row
- **THEN** the cell contains a link whose accessible name is the user's name and whose target is `/users/{id}`

## ADDED Requirements

### Requirement: User columns

The user list SHALL show each user's name, email, role and status in its own labeled column. Status SHALL be shown as text, so it does not depend on color alone.

#### Scenario: Row content
- **WHEN** a page of users loads
- **THEN** each row shows the user's name, email, role and status under column headers named Name, Email, Role and Status

### Requirement: Page size choice

The user list SHALL let an admin choose a page size of 25, 50 or 100 users, SHALL default to 25, and SHALL return to the first page when the page size changes.

#### Scenario: Default page size
- **WHEN** an admin opens the user list screen
- **THEN** the first request is `GET /users?skip=0&limit=25` and the page shows up to 25 users

#### Scenario: Change page size
- **WHEN** an admin on a later page changes the page size to 50
- **THEN** the screen shows the first page and requests `GET /users?skip=0&limit=50`

### Requirement: Loading state

While a page request is in flight, the user list SHALL show that users are loading and SHALL announce it to assistive technology through a polite live region.

#### Scenario: Page in flight
- **WHEN** an admin moves to a page whose request has not yet answered
- **THEN** the screen shows a loading indicator and a status message saying users are loading

### Requirement: Load failure with retry

When a page request fails, the user list SHALL show an error message announced to assistive technology, and SHALL offer a keyboard-operable action that retries the failed page.

#### Scenario: Page request fails
- **WHEN** `GET /users` answers with an error status
- **THEN** the screen shows a message saying the users could not be loaded, announced as an alert, with a Try again button

#### Scenario: Retry succeeds
- **WHEN** an admin activates Try again and the new request succeeds
- **THEN** the error message goes away and the page shows the loaded users
