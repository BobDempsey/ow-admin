## Why

At 320 px the header wraps the wordmark, five nav entries and the Theme control into four rows, so a phone-sized screen starts with a block of navigation before any content. A menu button with a drawer gives back that space and matches what admins expect on a phone.

## What Changes

- Below the `md` breakpoint (768 px), the nav entries are replaced in the header by a "Menu" button, and the header keeps the wordmark and the Theme control.
- The Menu button opens a drawer from the left holding the same five entries in the same order, with the current screen marked as it is in the wide header.
- Choosing an entry navigates and closes the drawer. Escape, a Close button and a click outside also close it, and focus returns to the Menu button unless the app navigated.
- At 768 px and wider nothing changes: the entries stay inline in the header and no Menu button shows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-navigation`: adds "Navigation drawer on narrow screens", and "Navigation reflows at narrow widths" now describes the drawer instead of wrapping.

## Impact

- `src/app/layout/top-nav.ts`: the entry list renders inline above the breakpoint and inside the drawer below it.
- A new `src/app/layout/nav-drawer.ts`, following the native `<dialog>` pattern of `ConflictDialog`.
- `src/app/app.ts`: the header row for one button plus the Theme control at narrow widths.
- Tests: `top-nav.spec.ts`, a new `nav-drawer.spec.ts`, and the e2e files that use the nav at 320 px (`e2e/keyboard.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/titles.e2e.ts` and any helper in `e2e/support/app.ts` that clicks a nav entry).
- `docs/accessibility.md` rows 1.3.1, 1.4.10, 2.1.1, 2.4.3, 2.4.7 and 4.1.2, and its state count.
- `polish-settings-dialog` and `add-theme-menu` both change the header; apply this change after them.
