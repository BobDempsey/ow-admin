## Why

The user reported that the Cancel button on the user detail screen does not work. A pass over every control in the app, by pointer and by keyboard at 1280 and 320 CSS pixels, found three more controls or messages that do nothing or say the wrong thing. This change fixes all four and writes down the behavior the specs left open.

## What Changes

Each bug below was reproduced with a Playwright script against `ng serve` on 2026-09-16.

### 1. Cancel on the user detail screen appears to do nothing

- Where: `/users/:id`, the Cancel button beside Save (`src/app/users/user-detail-page.ts`).
- Reproduce: open `/users/u-000042` and activate Cancel without editing. Nothing on screen changes, focus stays on Cancel, and nothing is announced. After an edit, Cancel does put the loaded values back, but it still stays on the screen and says nothing.
- Expected: Cancel discards unsaved edits and returns to the user list, the same as Cancel on the create screen (`/users/new`), which is a link to `/users`. No request is sent and focus moves to the list's heading.
- The current code matches the current `user-management` scenario "Cancel unsaved changes", which only asks for the loaded values to come back. This change rewrites that scenario (see the decision in `design.md`).

### 2. Choosing the current screen in the nav drawer leaves the drawer open

- Where: the Menu drawer below 768 CSS pixels (`src/app/layout/nav-drawer.ts`).
- Reproduce: at 320 CSS pixels on `/users`, activate Menu and then Users. The drawer stays open with focus on the Users link, and the link seems dead. The same happens for About on `/about`.
- Expected: the drawer closes and focus returns to the Menu button, since the screen does not change.

### 3. The nav drawer stays open after the viewport widens

- Where: the Menu drawer (`src/app/layout/nav-drawer.ts`).
- Reproduce: at 320 CSS pixels open the drawer, then widen the window to 1024 CSS pixels (a tablet rotating does the same). The Menu button is gone and the entries are back in the bar, but the modal drawer still covers the left of the screen and every control behind it, such as Table settings, ignores clicks until Escape.
- Expected: the drawer closes when the viewport reaches 768 CSS pixels, and focus moves to a visible control in the header.

### 4. "User created." shows for a user that was not just created

- Where: the status line on `/users/:id` (`src/app/users/user-detail-page.ts`).
- Reproduce: create a user, then reload the page. The in-memory store resets, so the screen says "User not found", and the status line under it still says "User created.". Creating a user, choosing Back to users, and pressing the browser Back button also shows "User created." again.
- Expected: "User created." shows once, on the navigation that follows a successful create, and never beside "User not found" or "The user could not be loaded".

### Checked and working

The wordmark, the Users and About entries, the three placeholders, the Theme menu (pointer, Enter, Space, arrows, Home, End, Escape, Tab and outside clicks), the skip link, New user, search (typing, Escape, clearing, no results), the Role and Status filters, sorting by pointer and Enter, paging by pointer and keyboard, page size, row click and Enter, Table settings with each setting and Close and Escape, every create screen control, Save, Back to users, Simulate, all three conflict choices, Reset password with Cancel, Escape and confirm, the not-found screen, and both About links all behave as their specs say.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-management`: "Edit user details" says Cancel returns to the user list, and a new "Created notice shown once" requirement limits "User created." to the navigation that follows a create.
- `admin-navigation`: "Navigation drawer on narrow screens" says what happens when the admin chooses the current screen's entry and when the viewport widens while the drawer is open.

## Impact

- `src/app/users/user-detail-page.ts` and `user-detail-page.spec.ts`: Cancel navigation, and the created notice read once.
- `src/app/layout/nav-drawer.ts` and `nav-drawer.spec.ts`: closing on a skipped same-URL navigation and on a breakpoint change.
- `e2e/keyboard.e2e.ts` or a new `e2e/ui-bugs.e2e.ts`: browser checks for all four bugs.
- `docs/accessibility.md` may need its 2.4.3 row updated if it describes Cancel or the drawer's focus.
- No API, store or dependency change.
