## 1. Cancel returns to the user list

- [ ] 1.1 In `user-detail-page.spec.ts`, replace "restores the loaded values on Cancel without a request" with a case that expects Cancel to be a link to `/users` and `saveUser` not to be called after clicking it, and in `e2e/keyboard.e2e.ts` change "edit: save and cancel work from the keyboard" to expect `/users` with focus on the Users heading after Enter on Cancel, and a reopened user to show the saved name without " III"; verify both fail against the current code
- [ ] 1.2 Render the detail screen's Cancel as `<a routerLink="/users">` with the create screen's classes and delete `cancel()`, and verify the tests from 1.1 pass

## 2. Choosing the current screen closes the drawer

- [ ] 2.1 Add a `nav-drawer.spec.ts` case that opens the drawer with an opener, navigates twice to the same test route, and expects the dialog closed and focus on the opener, and an `e2e/keyboard.e2e.ts` case that presses Enter on Users in the drawer at 320 px on `/users` and expects the drawer hidden and focus on Menu; verify both fail against the current code
- [ ] 2.2 Make `NavDrawer` close through `close()` on `NavigationSkipped` while open, and verify the tests from 2.1 and the existing "closes on navigation without taking focus back to the opener" case pass

## 3. Widening the viewport closes the drawer

- [ ] 3.1 Add a `nav-drawer.spec.ts` case with a stubbed `window.matchMedia` that fires a `(min-width: 48rem)` match while the drawer is open and expects the dialog closed and focus on the fallback element, and an `e2e/layout.e2e.ts` case that opens the drawer at 320 px, resizes to 1024 px, and expects the drawer hidden, focus on the wordmark, and Table settings to open on click; verify both fail against the current code
- [ ] 3.2 Give `NavDrawer.show()` a fallback focus element, have `TopNav` pass the wordmark link, and have `NavDrawer` close on the `md` media query match with the listener removed through `DestroyRef` and skipped when `matchMedia` is missing; verify the tests from 3.1 pass and `nav-drawer.spec.ts` shows no uncaught errors

## 4. "User created." is read once

- [ ] 4.1 Add `user-detail-page.spec.ts` cases that expect `Location.replaceState` to be called with a state keeping `navigationId` and dropping `notice`, and an empty status for a `404` rendered with `notice: 'created'`, and an e2e case that creates a user and then reloads, and another that creates a user, activates Back to users and goes back, each expecting the status never to read "User created."; verify they fail against the current code
- [ ] 4.2 Remove `notice` from the history entry in `afterNextRender` after reading it, and return the notice from `status` only while a user is loaded; verify the tests from 4.1 and the existing "announces a user that was just created" case pass

## 5. Docs and final checks

- [ ] 5.1 Update the 2.4.3 row in `docs/accessibility.md` to say Cancel on the detail screen moves focus to the user list's heading, choosing the current screen in the drawer returns focus to Menu, and a drawer closed by widening moves focus to the wordmark; verify the row names the tests that cover each
- [ ] 5.2 Run `ng test --watch=false` and verify every unit test passes
- [ ] 5.3 Run `ng build` and verify it succeeds with no new warnings
- [ ] 5.4 With port 4600 free, run `npm run test:a11y` and verify every browser test passes
- [ ] 5.5 Run `npx prettier --check src e2e` and verify it reports no files
- [ ] 5.6 Run `openspec validate fix-ui-bugs --strict` and verify the change is valid
