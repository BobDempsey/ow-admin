## Why

`/users` shows only a heading, so admins cannot see or reach any user yet. The list is the entry point to every other user management screen, and the PDF requires it to work against 500,000 users with server-side pagination.

## What Changes

- Replace the `/users` placeholder with a user list: a heading, the total user count, and an AG Grid Community grid with name, email, role and status columns.
- Load one page per `GET /users` request: `limit` equals the page size and `skip` equals the page index times the page size. The grid never holds the full dataset.
- Use AG Grid's built-in pagination panel with page sizes of 25, 50 and 100, defaulting to 25 to match the API's default `limit`.
- Open a user from the list by clicking the row, by following the link in the name cell, or by pressing Enter on a focused row. The link targets `/users/{id}`.
- Add a `/users/:id` route with a placeholder screen (a heading only), so opening a user lands somewhere. The user management task fills it in.
- Show a loading state while a page is in flight, and an error message with a retry action when a page fails to load.
- Add a `UsersService` over `UsersApi` that the screens share, starting with page loading and the total count.
- Add `ag-grid-angular` (and with it `ag-grid-community`) 36.1.0 as a dependency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-list`: pins each page to exactly one request, adds keyboard access to user detail, and adds requirements for the columns shown, page size choice, the loading state, and load failure with retry.

## Impact

- Changes `src/app/users/users-page.ts`, `src/app/app.routes.ts` and `src/app/app.routes.spec.ts`.
- New code under `src/app/users/` (list page pieces, the detail placeholder, `UsersService`).
- New runtime dependency: `ag-grid-angular` 36.1.0 (MIT), loaded only in the lazy `/users` chunk.
- `UsersApi` and the in-memory server are used as they are; no API contract change.
