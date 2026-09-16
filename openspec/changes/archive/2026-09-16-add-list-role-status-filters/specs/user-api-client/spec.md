## ADDED Requirements

### Requirement: Filtered user list

`GET /users` SHALL accept optional `role` and `status` query parameters.
`role` SHALL be one of `Admin`, `Member` or `Viewer`, and `status` one of
`active`, `invited` or `suspended`, matched exactly. When given, the
response SHALL contain only users with that role, that status, or both,
and `total` SHALL be the number of such users. The filters SHALL combine
with each other and with `q` so that a user is listed only when it meets
every one given, and SHALL combine with `sort`, `skip` and `limit`. A
missing or empty `role` or `status` SHALL not filter. Created and updated
users SHALL filter by their current values.

#### Scenario: Filter by role
- **WHEN** a caller requests `GET /users?role=Admin`
- **THEN** every item's role is `Admin`, and `total` equals the number of
  users whose role is `Admin`

#### Scenario: Filter by role and status
- **WHEN** a caller requests `GET /users?role=Viewer&status=suspended`
- **THEN** every item has role `Viewer` and status `suspended`, and
  `total` counts only users with both

#### Scenario: Filter with search and sort
- **WHEN** a caller requests
  `GET /users?q=hopper&status=active&sort=name:desc&skip=25&limit=25`
- **THEN** the items are the 26th to 50th active users whose name or email
  contains "hopper", in descending name order

#### Scenario: Edited user moves between filters
- **WHEN** a caller creates "Zelda Quartermaine" with status `invited`,
  updates her status to `suspended`, and requests
  `GET /users?q=quartermaine&status=suspended` and
  `GET /users?q=quartermaine&status=invited`
- **THEN** the first response lists her with `total` 1, and the second has
  no items and `total` 0

#### Scenario: Empty filter value
- **WHEN** a caller requests `GET /users?role=&status=`
- **THEN** the response is the unfiltered list and `total` is the full user
  count

### Requirement: Filter parameter validation

`GET /users` SHALL respond `400 Bad Request` with a message naming the
parameter when `role` or `status` is not empty and is not one of its
allowed values, including a value that differs only in case.

#### Scenario: Unknown role
- **WHEN** a caller requests `GET /users?role=Owner`
- **THEN** the response status is `400` with a message naming `role`

#### Scenario: Status in the wrong case
- **WHEN** a caller requests `GET /users?status=Active`
- **THEN** the response status is `400` with a message naming `status`
