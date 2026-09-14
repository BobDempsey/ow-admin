## 1. Routing and data

- [x] 1.1 Add `withComponentInputBinding()` to `provideRouter` and a lazy `users/new` route titled `New user` before `users/:id`, with a placeholder `NewUserPage` heading, and verify router tests show `/users/new` renders it with title `New user | Orbweaver Admin` and `/users/u-000001` still renders `UserDetailPage`
- [x] 1.2 Add `UsersService.loadUser`, `createUser` and `saveUser`, and verify tests against the in-memory API (latency 0) show a load returns an ETag, a create returns the new id and ETag, a save with that ETag returns a new ETag, and a save with the old ETag rejects with an `ApiError` of status 412
- [x] 1.3 Add `UsersService.simulateConcurrentEdit`, and verify a test shows it moves the user's status to the next value and a later save with the previously loaded ETag rejects with status 412

## 2. Form

- [x] 2.1 Add `userDraftSchema`, and verify tests show a blank or whitespace name and an invalid email are invalid and a complete draft is valid
- [x] 2.2 Build `UserFormFields` with labeled name, email, role and status controls, `aria-invalid` and `aria-describedby` wired to error text, and verify tests show each control's accessible name, errors appear after touch or submit, and `expectNoAxeViolations` passes with and without errors
- [x] 2.3 Prove server errors reach fields: in a test host, submit a form whose action maps a `400` `ApiError` with an `email` field error, and verify the email control shows the message and is `aria-invalid`

## 3. Create screen

- [x] 3.1 Build `NewUserPage` with the defaults from design.md, Back to users, `submit` through `createUser`, focus on the first invalid control when client validation fails, `400` field errors, the unexpected-failure alert, and navigation to `/users/{id}` with the created notice; verify tests cover each path and no `POST` is sent when validation fails
- [x] 3.2 Add the New user link to `UsersPage`, and verify a test shows a link named "New user" with `href` `/users/new` and both `UsersPage` axe tests still pass
- [x] 3.3 Run `expectNoAxeViolations` on `NewUserPage` empty, with client errors, and with a save failure, and verify no violations

## 4. Detail screen

- [x] 4.1 Replace `UserDetailPage` with the `resource()` load, the persistent heading, Back to users, the loading status, the `404` not-found view, and the load-failure alert with Try again; verify tests cover each state and Try again repeats the request and focuses the heading
- [x] 4.2 Add the edit form with Save through `saveUser` using the held ETag, "User saved.", Cancel restoring loaded values, client and `400` errors, the unexpected-failure alert, repeat-activation guard, and the created notice from navigation state; verify tests cover each and that a save updates the held ETag without a new `GET`
- [x] 4.3 Run `expectNoAxeViolations` on `UserDetailPage` loaded, not found, load failure and save failure, and verify no violations

## 5. Conflicts

- [x] 5.1 Build `ConflictDialog` on native `<dialog>` with its heading, description, and Keep editing, Reload and Overwrite buttons, Keep editing focused on open and Escape emitting `keep`; verify tests with `showModal` and `close` stubbed, plus `expectNoAxeViolations`
- [x] 5.2 Wire a `412` from Save to the dialog: Reload reloads and resets the form, Overwrite loads a fresh ETag and saves the edited values, a second `412` reopens the dialog, Keep editing keeps values and focuses Save; verify tests against the in-memory API cover all four
- [x] 5.3 Add the Demo section with "Simulate an edit by another admin" and its announcement, and verify a test shows simulate then Save opens the dialog and Reload shows the new status

## 6. Browser check

- [x] 6.1 In the running app at 1280 px and 320 px, keyboard only: create a user from the list, land on its detail screen with the created notice, edit and save, simulate then save to open the dialog, confirm focus is trapped, Escape and each choice work and focus returns to Save, a bad URL shows not found, and the page does not scroll sideways; run axe in the browser including color contrast, and record results in the handoff

## 7. Verification

- [x] 7.1 Verify `ng build`, `ng test --watch=false` and `npx prettier --check src` all pass and `openspec validate build-user-management --strict` passes
