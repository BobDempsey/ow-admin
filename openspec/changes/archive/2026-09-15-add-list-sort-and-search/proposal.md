## Why

The user list can only be paged. With 500,000 users, an admin cannot find a particular person, and a newly created user lands on page 20,001 with no way to reach it except Last Page. Sorting by any column and searching by name or email fix both.

## What Changes

- Every column (Name, Email, Role, Status) can be sorted ascending or descending by activating its header, with a pointer or the keyboard. One column sorts at a time.
- A "Search users" field above the grid, with the placeholder "Name or email", filters the list to users whose name or email contains the text, ignoring case.
- Sort and search happen on the server side: `GET /users` gains `sort` and `q` query parameters, and the list still requests one page at a time.
- The total shown above the list becomes the number of matching users while a search is active, and the result is announced to screen readers.
- This extends the PDF's API contract, which defines only `skip` and `limit`. The existing parameters and response shape do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-api-client`: adds sorted and searched listing to `GET /users`, with validation for the new parameters.
- `user-list`: adds column sorting and the search field, and changes "Total count displayed" to show the match count while searching.

## Impact

- `src/app/core/api/`: `UsersApi.list` and `PageRequest` gain `sort` and `q`; `user-validation.ts` validates them; the interceptor passes them to `UserStore.list`.
- `UserStore` gains cached sort orders for the seeded users and a search scan that includes created and edited users.
- `users-datasource.ts` maps AG Grid's `sortModel` to `sort`; `users-grid.ts` makes columns sortable; `users-page.ts` adds the search field and match announcements.
- Unit tests for the store, validation, API client, datasource and page; `e2e/` adds sort and search checks to the grid, keyboard, axe and layout tests.
- `docs/accessibility.md` covers the search field and sortable headers; `README.md` documents the new parameters.
- No new dependencies.
