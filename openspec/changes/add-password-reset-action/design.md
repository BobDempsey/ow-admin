## Context

`UserDetailPage` holds the loaded user and its `ETag` together in one `resource()` value, renders a form with Save and Cancel, and ends with a dashed "Demo" section holding "Simulate an edit by another admin". It has one `<p role="status">` whose text comes from a `status` computed (loading, then saving, then a `notice` signal), a `role="alert"` block for a failed load with Try again, and a `role="alert"` block for a failed save. `ConflictDialog` is a native `<dialog>` opened through `show()` with `showModal()`, focuses its safe choice, turns Escape (`cancel`) into that choice and closes itself before emitting. `src/testing/dialog.ts` stubs `showModal` and `close` for jsdom.

`UsersApi.resetPassword(id)` already posts to `/users/{id}/password-reset` with no `If-Match`, and the in-memory interceptor answers `204`, or `404` for an unknown id. `UsersService` has no reset method yet. The app has no delete, so a `404` from the reset can only come from a forced failure in a test.

The Role and Status `<select>` elements in `UserFormFields` (used by the detail and create screens) and the list's Role and Status filters in `UsersPage` share the same classes: `px-3` with the browser's native caret. Chromium draws that caret a fixed distance inside the right border and ignores `padding-right`, which is why it looks cramped.

## Goals / Non-Goals

**Goals:**
- A reset flow built from the dialog, status and alert patterns the detail screen already has.
- One caret style for every `<select>` in the app.

**Non-Goals:**
- Any change to `UsersApi.resetPassword`, the in-memory API, or the reset endpoint's contract.
- A reset action on the user list or the create screen.
- Rate limiting, a cooldown, or a record of when a reset was last sent.
- Changes to the Demo section.

## Decisions

**A "Password" section between the form and the Demo section.** It is a `<section aria-labelledby>` with an `h2` "Password", one line of text ("Send this user an email with a link to choose a new password."), and a secondary-style "Reset password" button (`border-line`, like Cancel). It sits outside the `<form>`, so Enter in a field never triggers it and Save stays the form's only submit. The Demo section stays last, since it is a testing aid rather than part of the product. Alternative: a button in the Save and Cancel row, rejected because it reads as part of saving the form, and the reset has nothing to do with the form's values.

**The button is never disabled.** The reset needs only the id, which does not change while the user is loaded, so it can run during a save or a reload that keeps the value. The section renders only while `user.hasValue()`, so a first load, a not-found user and a failed load show no button. A second activation while a reset runs is ignored in code, the way `save()` checks `busy()`. Alternative: `disabled` while busy, rejected because a disabled button drops focus and is skipped by Tab, and the other buttons on this screen stay enabled.

**A new `ResetPasswordDialog` that copies `ConflictDialog`'s pattern.** `src/app/users/reset-password-dialog.ts` takes `name` and `email` inputs and emits `confirmed` with `true` or `false`. It opens with `show()`, which calls `showModal()` and focuses Cancel. Escape arrives as `cancel`, which is prevented and handled as Cancel. The dialog closes itself before emitting, and the page moves focus to the "Reset password" button on either answer. Its text is:
- Heading: "Reset password?"
- Description: "Send {name} an email at {email} with a link to choose a new password?"
- Buttons: "Cancel" (secondary, first and focused) and "Send reset email" (primary `bg-primary`, not the danger red, because the reset destroys nothing and the current password keeps working until the user acts).

Alternative: turn `ConflictDialog` into a generic confirm dialog, rejected because the two dialogs have different button sets and outputs, and one more small component is easier to read than a configurable one.

**Messages reuse the screen's status line and a new alert.** A `resetting` signal feeds the `status` computed after loading and saving, as "Sending password reset email…". Success sets `notice` to "Password reset email sent.", the same way a save sets "User saved.". A failure sets `resetFailed`, which shows a `role="alert"` block inside the Password section, styled like the load failure: "The password reset email could not be sent." with a "Try again" button. Starting a reset, a save or Cancel clears `resetFailed`, and starting a reset clears `notice`. Try again moves focus to "Reset password" first, since the alert leaves the DOM, then repeats the request without the dialog; the admin already confirmed once.

**A 404 is a failure like any other.** The screen shows the same alert. The app has no delete, so the admin cannot reach this case, and a separate "user no longer exists" message would be text nobody sees. Alternative: reload the user to show the not-found state, rejected for the same reason.

**The reset leaves the form alone.** It never calls `user.set`, `user.reload` or `fields().reset`, so unsaved edits and the held `ETag` stay. `UsersService.resetPassword(id)` wraps the API call in `firstValueFrom`, like the other methods.

**Dropdown caret: `appearance-none` with a caret the app draws.** A `@utility select-caret` in `src/styles.css` sets `appearance: none`, `padding-right: 2.5rem`, and a chevron from a `--select-caret` SVG data URI placed at `right 0.75rem center` with a size of `1rem`. The chevron is stroked in `ink` (slate-900) in `:root` and redefined in `:root[data-theme='dark']` with slate-100, because a data URI cannot read a CSS variable; the `--check-mark` variable already works this way. Under `@media (forced-colors: active)` the utility sets `appearance: auto` and `background-image: none`, so the browser draws its own caret in system colors, as the settings dialog's checkboxes do. `UserFormFields` and both filters in `UsersPage` swap `px-3` for `pl-3 select-caret`. Alternative: right padding on the native `<select>`, rejected because Chromium ignores it for the caret's position, so it would not fix the report. Alternative: `appearance: base-select`, rejected because support is limited to recent Chromium.

**No requirement for the caret.** It changes how a control looks, not what it does, and no existing requirement describes select styling. The existing contrast requirement already covers the chevron as a meaningful graphic, so the checks record it there.

**Browser checks.** `e2e/support/app.ts` gets `openResetDialog` (open a user, activate "Reset password", wait for Cancel to have focus) and `forceResetFailure` (replace `users.resetPassword` through `ng.getComponent` with a rejecting stub, confirm, wait for the alert), following `forceSaveFailure`. `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` add three states at 1280 and 320 px in both themes: "password reset dialog", "password reset sent" and "password reset failure (forced through ng.getComponent)". That takes the suite from 17 to 20 states, and axe from 70 to 82 runs. `e2e/keyboard.e2e.ts` adds a flow: Tab to "Reset password", Enter, Escape (focus back, nothing sent), Enter, Tab to "Send reset email", Enter, and the status text.

## Risks / Trade-offs

- [The new dialog needs `stubDialogMethods()` in jsdom, and a missing stub shows up as errors in unrelated specs] → `reset-password-dialog.spec.ts` and `user-detail-page.spec.ts` call it, and the page only closes an open dialog.
- [A template ref named like a member shadows it and only `ng build` reports it] → name refs `resetButton` and `resetDialog`, distinct from `reset…` methods, and run `ng build`.
- [The `notice` line holds "Password reset email sent." until the next action, so a later save message replaces it] → accepted; it matches how "User saved." behaves.
- [A drawn caret can fall below 3:1 in one theme] → the chevron uses the `ink` colors, which already pass 4.5:1 on `surface` in both themes; the screenshot task checks it.
- [Swapping `px-3` for `pl-3 select-caret` changes select width, which could move the list's filter row at 320 px] → the layout suite already covers the list with a filter at 320 px; the screenshot task checks it too.
- [The Try again path sends a reset with no second confirmation] → accepted, since the admin confirmed the same action moments before, and the button text says what it repeats.
