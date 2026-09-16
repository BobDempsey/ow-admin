## Context

See `proposal.md` for the four bugs and how to reproduce them. The deltas in `specs/user-management` and `specs/admin-navigation` state the behavior each fix must reach.

The detail screen (`src/app/users/user-detail-page.ts`) is always an editable form, a choice made in `build-user-management` so there is no separate read-only view. Its form value is a `linkedSignal` built from the loaded `resource()` value. The create screen (`new-user-page.ts`) renders Cancel as `<a routerLink="/users">`.

`NavDrawer` (`src/app/layout/nav-drawer.ts`) is a native `<dialog>` opened with `showModal()`. It closes itself on `NavigationEnd`, and on Escape, Close and backdrop clicks. `TopNav` owns the Menu button and the wordmark and hides the Menu button with `md:hidden`.

## Goals / Non-Goals

**Goals:**
- Each bug gets one targeted fix and one test that fails before the fix.
- Focus always lands on a visible control after each fixed action (WCAG 2.4.3).

**Non-Goals:**
- Keeping list page, sort, search or filters when returning from a user. The list starts fresh today when opened from the nav or Back to users, and no spec asks otherwise.
- An "unsaved changes" prompt before Cancel or before leaving the screen.
- Closing Table settings on a backdrop click. Its spec lists only Close and Escape.
- Duplicate email checks in the in-memory API. The browser pass created a user with an existing email, but no spec asks the store to reject that, and the fix belongs to the API layer rather than the UI.

## Decisions

### 1. Cancel returns to the user list

**Cause.** `cancel()` calls `this.fields().reset(toDraft(this.loaded()))`, which puts the loaded values back and marks the form untouched. That matches the current "Cancel unsaved changes" scenario and works in the browser. On an unedited form it changes nothing, it announces nothing, and focus stays on Cancel, so the button looks broken. The create screen's Cancel leaves for `/users`, so the same label does two different things on two screens.

**Decision.** Cancel discards the edits and returns to `/users`. Render it as `<a routerLink="/users">Cancel</a>` with the create screen's classes, and delete `cancel()`. Leaving the screen destroys the component, which discards the draft, and `App` already moves focus to the list's `h1` after navigation. This is recorded for the user to review, since the old spec said Cancel restores the values in place.

**Alternatives.** Keep Cancel on the screen, restore the values, and announce "Changes discarded." through the status line. Rejected as the default because it keeps the label meaning something different from the create screen's Cancel, and an admin who opened a user only to look still has no Cancel that takes them back. A `<button>` that calls `router.navigate(['/users'])` works too, but a link matches the create screen and keeps middle click and "open in new tab".

**Test.** In `user-detail-page.spec.ts`, replace "restores the loaded values on Cancel without a request" with a case that finds Cancel as a link to `/users` and checks that `saveUser` was not called after clicking it. In `e2e/keyboard.e2e.ts`, change "edit: save and cancel work from the keyboard" so that Enter on Cancel lands on `/users` with focus on the Users heading, and reopening the user shows the saved name without " III". Both fail today because Cancel is a button that stays on the screen.

### 2. Choosing the current screen closes the drawer

**Cause.** `NavDrawer` closes only on `NavigationEnd`. A `routerLink` to the URL already shown makes the router skip the navigation (`onSameUrlNavigation` is `'ignore'` by default), and the router emits `NavigationSkipped`, not `NavigationEnd`. So the drawer never hears about it.

**Decision.** Also listen for `NavigationSkipped` and, when the drawer is open, call `close()`, which returns focus to the Menu button. Nothing on the screen changed, so the rule for Close and Escape applies.

**Alternatives.** A `(click)` handler on each drawer link. Rejected because the router event already covers pointer and Enter, and a click handler would also fire before real navigations, racing `App`'s focus move. Setting `onSameUrlNavigation: 'reload'` app-wide was rejected because it would re-run every same-URL link, including the wordmark on `/users`.

**Test.** In `nav-drawer.spec.ts`, open the drawer with an opener, emit a same-URL navigation through the router (navigate twice to the same test route), and check that the dialog closed and the opener has focus. In `e2e/keyboard.e2e.ts`, at 320 px on `/users`, open Menu, press Enter on Users, and check that the drawer is hidden and focus is on Menu.

### 3. Widening the viewport closes the drawer

**Cause.** Nothing closes the dialog when the breakpoint changes. `md:hidden` hides only the Menu button, and the `<dialog>` stays open and modal, so everything outside it is inert.

**Decision.** `NavDrawer` watches `matchMedia('(min-width: 48rem)')`, the Tailwind `md` breakpoint, and closes the dialog when it starts to match. The Menu button is `display: none` at that width, so focus cannot go back to it. `NavDrawer.show()` takes a second, fallback element, and `TopNav` passes the wordmark link, which is visible at every width. The listener is removed through `DestroyRef`. When `matchMedia` is missing (jsdom), the drawer skips the listener, as `ThemeService` does.

**Alternatives.** Hiding the dialog with CSS at `md` was rejected because a hidden modal dialog still makes the rest of the page inert. Focusing the current screen's entry in the bar was considered, but the About and Users screens both have one while a future screen might not, and the wordmark is always there.

**Test.** In `nav-drawer.spec.ts`, stub `window.matchMedia` with a controllable `change` event, open the drawer, fire a match, and check that the dialog closed and the fallback element has focus. In `e2e/layout.e2e.ts`, open the drawer at 320 px, resize to 1024 px, and check that the drawer is hidden, focus is on the wordmark, and Table settings opens its dialog on click.

### 4. "User created." is read once

**Cause.** The constructor reads `inject(Location).getState()` and shows "User created." when it has `notice: 'created'`. The router keeps that state in the history entry. A reload or a Back and Forward to the entry replays it, because the router copies history state back into the navigation. After a reload the in-memory store has reset, so the screen says "User not found" with "User created." under it. The `status` computed also returns the notice whatever the load state is.

**Decision.** Read the notice once, then remove `notice` from the history entry with `Location.replaceState(location.path(), '', rest)`, where `rest` keeps the router's own keys (`navigationId`, `ɵrouterPageId`). Do the replace in `afterNextRender`, after the router has written the entry for this navigation, so the router does not write the notice back. In `status`, return the notice only while a user is loaded, so it never sits beside "User not found" or the load failure alert.

**Alternatives.** Read `router.currentNavigation()` and show the notice only for an imperative navigation with a previous navigation. Rejected because it depends on router internals that differ between the initial load and later navigations, and it would still need the load-state check. A service holding a one-shot flag was rejected because it adds shared state for one message and still needs clearing rules.

**Test.** In `user-detail-page.spec.ts`, render with `state: { notice: 'created', navigationId: 2 }`, check that `Location.replaceState` was called with a state that has `navigationId` and no `notice`, and render a `404` with the same state and check the status is empty. In `e2e/`, create a user, reload, and check the status never reads "User created."; then create a user, choose Back to users, go back, and check the same.

## Risks / Trade-offs

- [Cancel leaves the screen while a save is still running] → The save still reaches the store and the list shows the result on its next load. Save already shows "Saving…", so this matches what Back to users does today.
- [The spec change for Cancel is a behavior change the user did not ask for in those words] → The decision is flagged in the change summary. If the user prefers the on-screen reset, only task 1 changes: keep the button, restore the values, and announce "Changes discarded.".
- [`replaceState` in `afterNextRender` could run before the router writes the URL under a different `urlUpdateStrategy`] → The app uses the default `deferred` strategy, which writes the entry before activation. The reload and Back e2e checks catch a regression.
- [`matchMedia` listeners in unit tests] → jsdom has no `matchMedia`, so the spec defines a stub per test, as `theme.service.spec.ts` does.
- [`docs/accessibility.md` 2.4.3 row lists the drawer's focus rules and says nothing about Cancel] → Task 5 updates that row.
