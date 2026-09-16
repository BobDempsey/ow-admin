## Why

The API client already sends `POST /users/{id}/password-reset`, and `password-reset` already says an admin SHALL trigger a reset from the detail screen, but no control does it. The PDF lists the endpoint without asking for a UI control; the user chose to add one. The user also reported that the dropdown carets on the detail screen sit too close to the right edge.

## What Changes

- The user detail screen at `/users/:id` gets a "Password" section below the form with a "Reset password" button.
- The button opens a confirmation dialog. Cancel (focused first) and Escape close it with no request; "Send reset email" calls `POST /users/{id}/password-reset` with no `If-Match`.
- Success is announced in the screen's existing status line as "Password reset email sent." Failure shows an alert with a Try again button that repeats the request.
- The reset leaves the form, its unsaved edits, the held `ETag` and the Demo section alone.
- The Role and Status dropdowns get a caret drawn by the app with room on its right, on the detail and create screens (shared form fields) and on the user list's Role and Status filters, which have the same problem.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `password-reset`: "Trigger password reset" now describes the confirmation, the announcements, failure with retry, and that unsaved edits survive.
- `accessibility`: "Full keyboard operability" names the password reset again, which was dropped while the reset UI was optional.

## Impact

- `src/app/users/user-detail-page.ts`: the Password section, the reset flow and its messages.
- A new `src/app/users/reset-password-dialog.ts`, following `ConflictDialog`'s native `<dialog>` pattern.
- `src/app/users/users.service.ts`: a `resetPassword` method over `UsersApi.resetPassword`, which is unchanged.
- `src/styles.css`, `src/app/users/user-form-fields.ts` and `src/app/users/users-page.ts`: the dropdown caret.
- Tests: `user-detail-page.spec.ts`, a new `reset-password-dialog.spec.ts`, `users.service.spec.ts`, and `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/keyboard.e2e.ts` and `e2e/support/app.ts`.
- `docs/accessibility.md` rows and state count, and `README.md` if it lists what the detail screen does.
