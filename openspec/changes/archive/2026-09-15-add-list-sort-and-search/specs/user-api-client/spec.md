## ADDED Requirements

### Requirement: Sorted user list

`GET /users` SHALL accept an optional `sort` query parameter of the form `<field>:<direction>`, where field is `name`, `email`, `role` or `status` and direction is `asc` or `desc`. The response SHALL list users in that order, comparing values without regard to case, with ties broken by user id ascending, and paging with `skip` and `limit` SHALL apply to the sorted order. Without `sort` the order SHALL stay by id ascending, as today. Created and updated users SHALL sort by their current values.

#### Scenario: Sort by name ascending
- **WHEN** a caller requests `GET /users?sort=name:asc&limit=25`
- **THEN** the 25 items are in ascending name order, users with the same name are in ascending id order, and `total` is the full user count

#### Scenario: Sort descending across pages
- **WHEN** a caller requests `GET /users?sort=email:desc&skip=0&limit=25` and then `GET /users?sort=email:desc&skip=25&limit=25`
- **THEN** every email on the second page sorts at or after the last email on the first page in descending order, and no user appears on both pages

#### Scenario: Edited user moves in the sort order
- **WHEN** a caller renames user `u-000042` to "Aaron Aardvark" and requests `GET /users?sort=name:asc&limit=1`
- **THEN** the only item is user `u-000042`

### Requirement: Searched user list

`GET /users` SHALL accept an optional `q` query parameter. When `q` has non-blank text after trimming, the response SHALL contain only users whose name or email contains that text, ignoring case, and `total` SHALL be the number of matching users. `q` SHALL combine with `sort`, `skip` and `limit`. A missing or blank `q` SHALL not filter.

#### Scenario: Search by name fragment
- **WHEN** a caller requests `GET /users?q=lamport`
- **THEN** every item's name or email contains "lamport" in any case, and `total` equals the number of such users

#### Scenario: Search by email
- **WHEN** a caller requests `GET /users?q=radia.lamport.42@`
- **THEN** the response contains user `u-000042` and `total` is 1

#### Scenario: Search finds a created user
- **WHEN** a caller creates a user named "Zelda Quartermaine" and requests `GET /users?q=quartermaine`
- **THEN** the created user is the only item and `total` is 1

#### Scenario: No matches
- **WHEN** a caller requests `GET /users?q=no-such-user-xyz`
- **THEN** the response is `200` with an empty `items` array and `total` 0

#### Scenario: Search and sort together
- **WHEN** a caller requests `GET /users?q=hopper&sort=email:asc&skip=25&limit=25`
- **THEN** the items are the 26th to 50th matching users in ascending email order

### Requirement: Sort and search parameter validation

`GET /users` SHALL respond `400 Bad Request` with a message naming the parameter when `sort` does not match `<field>:<direction>` with a supported field and direction, or when `q` is longer than 100 characters.

#### Scenario: Unknown sort field
- **WHEN** a caller requests `GET /users?sort=password:asc`
- **THEN** the response status is `400` with a message naming `sort`

#### Scenario: Bad sort direction
- **WHEN** a caller requests `GET /users?sort=name:up`
- **THEN** the response status is `400` with a message naming `sort`

#### Scenario: Query too long
- **WHEN** a caller requests `GET /users` with a `q` of 101 characters
- **THEN** the response status is `400` with a message naming `q`
