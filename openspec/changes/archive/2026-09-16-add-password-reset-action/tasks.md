## 1. Service and dialog

- [x] 1.1 Add `resetPassword(id)` to `UsersService` over `UsersApi.resetPassword`, and verify a `users.service.spec.ts` case checks it posts to `/users/{id}/password-reset` with no `If-Match` and rejects with an `ApiError` on `404`
- [x] 1.2 Add `ResetPasswordDialog` in `src/app/users/reset-password-dialog.ts` following `ConflictDialog`, with the heading, description and buttons from design.md, and verify `reset-password-dialog.spec.ts` (using `stubDialogMethods()`) covers `show()` opening the dialog with focus on Cancel, the name and email in the text, Cancel and Escape emitting `false`, "Send reset email" emitting `true`, and the dialog closing before it emits

## 2. Detail screen

- [x] 2.1 Add the Password section between the form and the Demo section, rendered only while the user is loaded, and verify `user-detail-page.spec.ts` finds the heading and the "Reset password" button on a loaded user and no button on the not-found and load failure states
- [x] 2.2 Open the dialog from the button, send the reset only on confirm, return focus to the button on either answer, and ignore a second activation while a reset runs, and verify spec cases for confirm, Cancel, Escape, focus return and a single request during a slow reset
- [x] 2.3 Announce "Sending password reset email…" and "Password reset email sent." through the status line, show the failure alert with Try again on any error including `404`, and make Try again move focus to "Reset password" and repeat the request without the dialog, and verify spec cases for each message, the alert's role, and the retry
- [x] 2.4 Verify with a spec case that an unsaved field edit and the held `ETag` survive a reset, and that the Demo section and "Simulate an edit by another admin" still work as before

## 3. Dropdown caret

- [x] 3.1 Add the `--select-caret` variable for both themes and the `select-caret` utility with its forced colors fallback to `src/styles.css`, swap `px-3` for `pl-3 select-caret` on the selects in `user-form-fields.ts` and on the Role and Status filters in `users-page.ts`, and verify `ng build` passes and the existing specs for both files still pass
- [x] 3.2 Take screenshots of the detail screen, the create screen and the filtered user list in both themes at 1280 and 320 px, plus the detail screen with forced colors emulated, and verify the caret shows with space on its right, and that a Playwright check finds the right edge of the longest option's text (`suspended` and "Any status") left of the caret area in each select at both widths

## 4. Browser checks

- [x] 4.1 Add `openResetDialog` and `forceResetFailure` to `e2e/support/app.ts`, add the three reset states from design.md to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts`, and verify `npm run test:a11y` passes with port 4600 free
- [x] 4.2 Add the keyboard reset flow from design.md to `e2e/keyboard.e2e.ts`, and verify it passes and shows that Escape sent no request

## 5. Docs and checks

- [x] 5.1 Update `docs/accessibility.md` for the Password section, the reset dialog, the new states (20 states, 82 axe runs) and the drawn caret, and update `README.md`'s "No UI calls it yet" line for the reset endpoint, and verify `npx prettier --check src e2e` is clean
- [x] 5.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` with port 4600 free, `npx prettier --check src e2e` and `openspec validate add-password-reset-action --strict`, and verify all pass
