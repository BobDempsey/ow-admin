# user-list Specification

## Purpose
Lets admins browse the full user base at scale (up to 500,000 users)
without ever loading or rendering the full set at once.

## Requirements

### Requirement: Server-side paginated list

The user list screen SHALL display users using server-side pagination
against the `user-api-client` `GET /users` endpoint (`skip`/`limit`), never
by loading the full user set and slicing it on the client.

#### Scenario: Initial page load
- **WHEN** an admin opens the user list screen
- **THEN** the screen requests a single page of users via `GET /users`
  rather than fetching all users

#### Scenario: Navigate to next page
- **WHEN** an admin moves to the next page of results
- **THEN** the screen issues a new `GET /users` request with an updated
  `skip` value instead of slicing already-fetched data

### Requirement: Total count displayed

The user list screen SHALL show the total number of users, sourced from
the API response's `total` field.

#### Scenario: Total shown alongside page
- **WHEN** a page of users loads successfully
- **THEN** the screen displays the total user count returned by the API

### Requirement: Navigate to user detail

The user list screen SHALL let an admin open an individual user's detail
view from the list.

#### Scenario: Open a user from the list
- **WHEN** an admin selects a user row in the list
- **THEN** the system navigates to that user's view/edit screen
