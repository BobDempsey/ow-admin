## Why

Admins can list users but cannot create one or change one: `/users/:id` shows only a heading, and nothing in the UI calls `POST /users` or `PUT /users/{id}`. The PDF requires both, and requires a `412 Precondition Failed` on save to reach the admin as a reload-or-overwrite choice instead of a silent failure.

## What Changes

- Add a New user button to the user list that opens a create screen at `/users/new`.
- Build the create screen: a form with name, email, role and status, client-side validation with field-level messages, and `POST /users` on submit. On success the admin lands on the new user's detail screen with a confirmation.
- Replace the `/users/:id` placeholder with the view and edit screen: it loads the user with `GET /users/{id}`, keeps the returned ETag, and shows the fields in an editable form. Save sends `PUT /users/{id}` with `If-Match`; Cancel restores the last loaded values.
- Show loading, not found and load failure (with Try again) states on the detail screen.
- Map `400` field errors from the API onto the matching form fields on both screens.
- On a `412` from save, open a modal dialog that says the user changed since it was loaded and offers Reload, Overwrite and Keep editing. Overwrite fetches the current ETag and retries the save with the admin's values.
- Add a labeled "Simulate an edit by another admin" control to the detail screen. It changes the user through the API the way a second client would, so the next Save returns `412` and a reviewer can see the conflict flow in a single tab.
- Extend `UsersService` with single-user load, create and update, holding each loaded user's ETag beside its record.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-management`: sets where create lands, makes the detail screen an always-editable form with Cancel, adds a Keep editing choice and repeat-conflict handling to the conflict flow, and adds requirements for detail load states, server-side validation errors, unexpected save failures and the simulated concurrent edit.
- `user-list`: adds a New user entry point on the list screen.

## Impact

- Changes `src/app/users/user-detail-page.ts`, `src/app/users/users-page.ts`, `src/app/users/users.service.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts` and their tests.
- New code under `src/app/users/`: the create screen, shared form fields and schema, the conflict dialog, and the simulate control.
- Uses Signal Forms from `@angular/forms/signals`, already installed with `@angular/forms` 22.1; no new dependency.
- `UsersApi` and the in-memory server are used as they are; no API contract change.
- Password reset stays out of scope; it is a separate optional task.
