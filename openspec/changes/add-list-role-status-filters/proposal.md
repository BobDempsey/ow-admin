## Why

Admins can search the list by name or email, but they cannot narrow 500,000 users to, say, suspended admins. Role and status are closed sets of three values each, so they suit a filter better than free-text search.

## What Changes

- `GET /users` accepts optional `role` and `status` query parameters, each one exact value from its closed set. They combine with `q`, `sort`, `skip` and `limit`, and `total` counts the users that match all of them. An unknown value is a `400`. Like `sort` and `q`, both extend the PDF's contract.
- `UsersApi.list` sends `role` and `status`.
- The user list shows two labeled dropdowns, Role and Status, beside the Search users field. Each starts on "Any role" or "Any status", and a choice applies at once, returns the list to its first page, and keeps the sort and the search.
- While a filter is active, the total and the result announcement use the same "match" wording as a search, and an empty result says no users match the search or filters.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-api-client`: adds "Filtered user list" and "Filter parameter validation".
- `user-list`: adds "Filter by role and status" and "Filter results worded as matches".

## Impact

- `src/app/core/api/user.model.ts`: `PageRequest` gains `role` and `status`.
- `src/app/core/api/in-memory/user-validation.ts`, `user-store.ts` and `in-memory-api.interceptor.ts`: parse, validate and apply the filters.
- `src/app/core/api/users-api.ts`: sends the parameters.
- `src/app/users/users-page.ts`, `users-grid.ts` and `users-datasource.ts`: the dropdowns, and a list query that carries search and filters together.
- Tests: the store, validation, interceptor, client, datasource and page specs, and a new `e2e/filter.e2e.ts`.
- Docs: `README.md`'s endpoint table and `docs/accessibility.md` rows 1.3.1, 3.3.2 and 4.1.3.
- `users-page.ts` is also edited by `fix-search-match-count` and `polish-settings-dialog`; apply this change after both.
