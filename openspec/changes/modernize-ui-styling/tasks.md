Every group ends in one commit and leaves the app building and working. "Group checks" means: `ng test --watch=false`, `ng build` with no warnings, `npx prettier --check src e2e`, and the named e2e files through `npx playwright test <files>` with port 4600 free. Commit messages follow design.md's Rollback section.

## 1. Tailwind class sorting

- [ ] 1.1 Add `prettier-plugin-tailwindcss` 0.8.1 as an exact dev dependency, and set `"plugins": ["prettier-plugin-tailwindcss"]` and `"tailwindStylesheet": "./src/styles.css"` in `.prettierrc`, and verify `npx prettier --check src/styles.css` still runs
- [ ] 1.2 Run `npx prettier --write src e2e` once, and verify with `git diff` that the only changes are reordered class lists, including inside the inline `template` strings of a component such as `users-page.ts`; if inline templates are not sorted, note it for the README task in group 14
- [ ] 1.3 Run the group checks with `e2e/smoke.e2e.ts`, and verify all pass
- [ ] 1.4 Commit this group as `chore(format): sort Tailwind classes with prettier-plugin-tailwindcss`

## 2. Tokens and bracket values

- [ ] 2.1 Add the tokens from design.md to `src/styles.css` in both themes (`line-subtle`, `shadow`, `skeleton`, the nine `status-*` tokens, the twelve `avatar-*` tokens, `nav-current`), plus `--radius-card` and `--shadow-card`, and verify `ng build` passes and a throwaway template using `rounded-card shadow-card bg-status-active-surface` compiles to rules that read the variables
- [ ] 2.2 Add `@utility w-dialog` and use it in `conflict-dialog.ts`, `reset-password-dialog.ts` and `table-settings-dialog.ts`, replace `border-b-[3px]` with `border-b-3` in `top-nav.ts`, and verify a search for `-[calc(100%-2rem)]` and `border-b-[3px]` under `src` finds nothing and the dialog specs pass
- [ ] 2.3 Move `contrast()` from `e2e/settings.e2e.ts` to `e2e/support/contrast.ts`, and add `e2e/contrast.e2e.ts`, which resolves each new token pair through a probe element in both themes and asserts 4.5:1 for the pill, avatar and `nav-current`-on-surface pairs (3:1 for `nav-current`), and that `--shadow-card` renders a different computed `box-shadow` in dark; verify it passes and record the measured values for group 14
- [ ] 2.4 Run the group checks with `e2e/contrast.e2e.ts`, `e2e/settings.e2e.ts` and `e2e/layout.e2e.ts`, and verify all pass
- [ ] 2.5 Commit this group as `refactor(styles): add card, pill, avatar and skeleton tokens and name repeated bracket values`

## 3. Inter typeface

- [ ] 3.1 Add `@fontsource-variable/inter` 5.3.0 as an exact dependency, confirm the latin and latin-ext `wght-normal` woff2 file names and `unicode-range` values in its package, add the `angular.json` asset entry that copies them to `/fonts/`, and verify `ng build` puts both files under `dist/…/browser/fonts/`
- [ ] 3.2 Declare the two `@font-face` rules, the `Inter Fallback` face and `--font-sans` in `src/styles.css`, and add the preload link with `crossorigin` to `src/index.html`; verify in the browser that body text computes to "Inter Variable", `document.fonts.check('1em "Inter Variable"')` is true after load, the network log shows one request for the latin file, and a screenshot with the font request blocked keeps the same line breaks on the list and detail screens (tune the fallback overrides until it does)
- [ ] 3.3 Add `tabular-nums` to the total beside the heading and the detail screen's ID line, and a rule for `app-users-grid .ag-paging-panel`, and verify `users-page.spec.ts` and `user-detail-page.spec.ts` find the class, and a new `e2e/layout.e2e.ts` check reads `font-variant-numeric: tabular-nums` on the total and the paging panel
- [ ] 3.4 Run the group checks with `e2e/layout.e2e.ts`, `e2e/axe.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass with no preload warning
- [ ] 3.5 Commit this group as `feat(ui): self-host Inter as the UI typeface with tabular numbers`

## 4. Light header

- [ ] 4.1 Change `App`'s header to `border-b border-line-subtle bg-surface`, and switch `TopNav`, `NavDrawer` and `ThemeSwitcher` from the `header-*` classes to the general tokens and `nav-current` listed in design.md, and verify `top-nav.spec.ts`, `nav-drawer.spec.ts`, `theme-switcher.spec.ts` and `app.spec.ts` pass after any class assertions move to the new tokens
- [ ] 4.2 Remove the seven `header-*` tokens from both theme blocks in `src/styles.css`, and verify a search for `header-` in `src` finds no class or token left, and `ng build` passes
- [ ] 4.3 Add header pairs to `e2e/contrast.e2e.ts` (nav text, text on hover, placeholder entries, the focus ring, and the current-entry underline on the header and on its hover fill), and verify they pass in both themes
- [ ] 4.4 Take screenshots of the list at 1280 and 320 px in both themes, with the drawer open at 320 px, and verify the header is surface-colored with a visible bottom border and the underline under Users
- [ ] 4.5 Run the group checks with `e2e/contrast.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/keyboard.e2e.ts` and `e2e/theme.e2e.ts`, and verify all pass
- [ ] 4.6 Commit this group as `feat(ui): make the header light with a bottom border in both themes`

## 5. Screen descriptions

- [ ] 5.1 Add the description lines from design.md to the Users, New user and loaded detail screens, keep the total and New user in the Users title row, move the detail ID line below the description for now, and give About's lead paragraph the same style; verify spec cases in `users-page.spec.ts`, `new-user-page.spec.ts`, `user-detail-page.spec.ts` and `about-page.spec.ts` find each description, and that no description shows for a missing user or a load failure
- [ ] 5.2 Re-measure `GRID_HEIGHT_OFFSET` at 1280 by 900 with Fixed header on, and verify the fixed-header tests in `e2e/settings.e2e.ts` and `e2e/layout.e2e.ts` pass and the page does not scroll at that size
- [ ] 5.3 Run the group checks with `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/settings.e2e.ts` and `e2e/titles.e2e.ts`, and verify all pass
- [ ] 5.4 Commit this group as `feat(ui): add a one-line description under each screen title`

## 6. Cards

- [ ] 6.1 Wrap the list's filter row, status line, alert and grid in one `rounded-card border border-line-subtle bg-surface shadow-card overflow-clip` card, and set `wrapperBorder: false` and `wrapperBorderRadius: 0` in both theme param sets in `users-grid.ts`; verify `users-page.spec.ts` passes and a screenshot shows the grid flush inside the card in both themes
- [ ] 6.2 Put the detail screen's form, Password and Demo sections in cards (Demo keeps its dashed edge), add the form card's "Details" heading with the ID line under it, and put the create screen's form in a card; verify `user-detail-page.spec.ts` and `new-user-page.spec.ts` pass with a case for the "Details" heading
- [ ] 6.3 Re-measure `GRID_HEIGHT_OFFSET`, and verify the fixed-header tests pass and the focus checks in `e2e/layout.e2e.ts` find no obscured or clipped focus on any list state
- [ ] 6.4 Run the group checks with `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/settings.e2e.ts` and `e2e/keyboard.e2e.ts`, and verify all pass
- [ ] 6.5 Commit this group as `feat(ui): put the user table and the detail sections in cards`

## 7. Status and role pills

- [ ] 7.1 Add `UserPillCell` with the complete class strings for each status and the neutral role pill, and verify `user-pill-cell.spec.ts` covers each status word and class set, the role pill, and an empty render for a stub row
- [ ] 7.2 Use it for the Role and Status columns with `cellRendererParams`, raise the Status column minimum to 140 px, and verify `users-grid.spec.ts` checks both column definitions
- [ ] 7.3 Add pill pairs to `e2e/contrast.e2e.ts`, reading rendered pills for an active, an invited and a suspended user and a role pill on plain and striped rows in both themes, and verify each is at least 4.5:1
- [ ] 7.4 Verify `e2e/layout.e2e.ts` text spacing and zoom checks and `e2e/grid.e2e.ts`'s Compact check find no clipped pill text at 320 and 1280 px
- [ ] 7.5 Run the group checks with `e2e/contrast.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/grid.e2e.ts` and `e2e/filter.e2e.ts`, and verify all pass
- [ ] 7.6 Commit this group as `feat(users): show role and status as pills in the user grid`

## 8. Initials avatars

- [ ] 8.1 Add `initialsOf` and `avatarColorIndex` in `src/app/users/user-avatar.ts`, and verify `user-avatar.spec.ts` covers two words ("Radia Lamport" to "RL"), three words, one word, extra spaces, an accented first letter, and a stable index in the range 0 to 5
- [ ] 8.2 Render the `aria-hidden` circle before the link in `UserNameCell`, with the six complete class pairs, and raise the Name column minimum to 220 px; verify `user-name-cell.spec.ts` checks the initials, `aria-hidden`, the color class for a known id, and that the link's accessible name is still only the name
- [ ] 8.3 Add one avatar of each color to `e2e/contrast.e2e.ts` in both themes, and verify each is at least 4.5:1
- [ ] 8.4 Add a check to `e2e/grid.e2e.ts` that a user's circle keeps its class after paging away and back, and verify the text spacing, zoom and Compact checks still find no clipped name text
- [ ] 8.5 Run the group checks with `e2e/contrast.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/grid.e2e.ts` and `e2e/search.e2e.ts`, and verify all pass
- [ ] 8.6 Commit this group as `feat(users): show an initials avatar beside each user name`

## 9. Filter toolbar and chips

- [ ] 9.1 Wrap Search users, Role and Status in `<div role="search" aria-label="Filter users">`, place Table settings at the card's top-right outside it, and verify `users-page.spec.ts` finds the three controls inside the group and Table settings outside it
- [ ] 9.2 Add `FilterChips` with the `chips` input and `remove` and `clearAll` outputs, and verify `filter-chips.spec.ts` covers labels, the "Remove filter" accessible names, the list label, and no render with no chips
- [ ] 9.3 Add the `chips` computed, chip removal and `clearAll()` to `UsersPage` as design.md describes, and verify spec cases for each chip's removal, the search chip clearing without the debounce, Clear all sending one query change, the result announcement after each, and focus moving to the next chip, the new last chip or Search users
- [ ] 9.4 Update the two Table settings placement tests in `e2e/layout.e2e.ts`, add chip and Clear all flows with recorded requests to `e2e/filter.e2e.ts`, add the chip Tab order and a keyboard chip removal to `e2e/keyboard.e2e.ts`, add chip removal and Clear all to `e2e/console.e2e.ts`, and add the "user list with a search and two filters" state to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` (21 states, 86 axe runs); verify all pass
- [ ] 9.5 Run the group checks with `e2e/filter.e2e.ts`, `e2e/search.e2e.ts`, `e2e/keyboard.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/settings.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass
- [ ] 9.6 Commit this group as `feat(users): add removable filter chips and Clear all to the user list toolbar`

## 10. Skeleton rows

- [ ] 10.1 Add `SkeletonCell` with the per-column shapes, `aria-hidden` bars and `motion-safe:animate-pulse`, reading `loading` from the grid context, and verify `skeleton-cell.spec.ts` covers each shape, `aria-hidden`, and no bars while `loading` is false
- [ ] 10.2 Add the `cellRendererSelector` to `defaultColDef`, pass `{ loading }` through `context`, and set `infiniteInitialRowCount` to the page size; verify `users-grid.spec.ts` checks the selector returns the skeleton only for rows without data, and a browser check shows a full page of skeletons on first load and correct paging panel text once it answers
- [ ] 10.3 Move "Loading users…" into an `sr-only` span and drop the status line's `min-h-6`, and verify the `users-page.spec.ts` cases that expected visible loading text now expect it hidden and still present
- [ ] 10.4 Add `holdListLoad` to `e2e/support/app.ts` (a `loadPage` stub held through `ng.getComponent`) and the "user list while a page loads" state to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` (22 states, 90 axe runs); add `e2e/grid.e2e.ts` checks that skeleton bars show while held, have no animation under `reducedMotion: 'reduce'`, are gone after the load and after a forced failure, and that a density change shows none; verify all pass
- [ ] 10.5 Run the group checks with `e2e/grid.e2e.ts`, `e2e/settings.e2e.ts`, `e2e/search.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass
- [ ] 10.6 Commit this group as `feat(users): show skeleton rows while a page of users loads`

## 11. Empty state

- [ ] 11.1 Add `EmptyUsersOverlay` and wire it through `noRowsOverlayComponent` with `filtered` and `clearFilters` params, then check in the browser that no ancestor of Clear filters has `aria-hidden` or `pointer-events: none` and that Tab from the grid reaches it; if either fails, switch to the fallback in design.md; verify `empty-users-overlay.spec.ts` covers both variants and the button's callback
- [ ] 11.2 Add the `clearFilters` output to `UsersGrid` and handle it in `UsersPage` with `clearAll()`, and verify `users-grid.spec.ts` and `users-page.spec.ts` cases for the output and for focus landing on Search users
- [ ] 11.3 Replace "No users match your search or filters." in `e2e/filter.e2e.ts` and `e2e/search.e2e.ts` with the empty state's heading, help and button, add a Clear filters flow with recorded requests and focus, a keyboard path in `e2e/keyboard.e2e.ts`, and Clear filters in `e2e/console.e2e.ts`; verify all pass and the "user list with no search results" axe and layout states pass
- [ ] 11.4 Run the group checks with `e2e/filter.e2e.ts`, `e2e/search.e2e.ts`, `e2e/keyboard.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass
- [ ] 11.5 Commit this group as `feat(users): show an empty state with Clear filters when nothing matches`

## 12. Row Actions menu

- [ ] 12.1 Add `UserActionsCell` and the Actions column with `lockPosition: 'right'`, and verify `user-actions-cell.spec.ts` covers the button's name, `tabindex="-1"`, `aria-haspopup`, `aria-expanded`, and the context call on click
- [ ] 12.2 Add `RowActionsMenu` with the positioning, keyboard handling, outside click, scroll and resize closing from design.md, and verify `row-actions-menu.spec.ts` covers focus on View at open, arrow wrap, Home and End, Enter and Space on each item, Escape and Tab returning focus through the callback, an outside `pointerdown`, and flipping above near the viewport bottom
- [ ] 12.3 Handle Enter and Space on the Actions cell, ignore row clicks inside `a` and `button`, add `focusActionsCell` and the `resetPassword` output, and verify `users-grid.spec.ts` cases that Enter on the Actions cell opens the menu without `openUser`, Enter on other cells still emits `openUser`, and a click on the button emits nothing
- [ ] 12.4 Add the list reset flow to `UsersPage` (one `ResetPasswordDialog`, `resetTarget`, one reset at a time, the status texts, the failure alert and Try again, and focus return with the heading fallback), and verify `users-page.spec.ts` cases, using `stubDialogMethods()` and a deferred promise, for confirm, Cancel, Escape, the in-progress text, a second choice ignored, success text, failure alert, Try again without the dialog, and no list reload
- [ ] 12.5 Add `e2e/row-actions.e2e.ts` for keyboard and pointer opening, View, Escape, Tab, outside click, the menu's position for the last row at 320 px, and a list reset with recorded requests; add the row menu to `e2e/keyboard.e2e.ts` and `e2e/console.e2e.ts`; add the "user list with the row menu open" and "user list with the password reset dialog" states to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` (24 states, 98 axe runs); verify all pass
- [ ] 12.6 Run the group checks with `e2e/row-actions.e2e.ts`, `e2e/grid.e2e.ts`, `e2e/keyboard.e2e.ts`, `e2e/settings.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass
- [ ] 12.7 Commit this group as `feat(users): add a row Actions menu with View and Reset password`

## 13. Detail layout and save bar

- [ ] 13.1 Lay out the loaded detail content as `lg:grid-cols-3` with the form card spanning two columns and the Password and Demo cards in the aside, and verify `user-detail-page.spec.ts` checks DOM order and a screenshot at 1280 and 800 px shows two columns and one
- [ ] 13.2 Add the `unsaved` computed, the bar with its always-present status text, Save's `aria-describedby`, the `tall` custom variant, the sticky classes and `data-save-bar-stuck`, and verify spec cases for no text on load, "Unsaved changes" after an edit, the text staying the same while typing, and the text clearing after a save, after a Reload from the conflict dialog, and after typing a value back
- [ ] 13.3 Add the `scroll-padding-bottom` rule and the form's `focusin` handler, and verify a spec case that focusing a field calls `scrollIntoView` with `block: 'nearest'`
- [ ] 13.4 Add `e2e/save-bar.e2e.ts` for the bar in view at 320 by 568, not sticky at 320 by 256, the single announcement recorded through a `MutationObserver`, no bar-covered focus while tabbing at 1280 by 600 and 320 by 568, and the Tab order at 1280 and 320 px; add the save bar to `e2e/console.e2e.ts` and the "user detail with unsaved edits" state to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` (25 states, 102 axe runs); verify all pass
- [ ] 13.5 Run the group checks with `e2e/save-bar.e2e.ts`, `e2e/keyboard.e2e.ts`, `e2e/created-notice.e2e.ts`, `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts` and `e2e/console.e2e.ts`, and verify all pass
- [ ] 13.6 Commit this group as `feat(users): lay out the detail screen in two columns with a save bar that stays in view`

## 14. Docs and full checks

- [ ] 14.1 Update the Theme colors table in `docs/accessibility.md`: replace the header rows with the measured surface-header pairs, and add the pill, avatar, `nav-current`, skeleton and card border pairs, marking decorative pairs "no minimum"; verify every new token from design.md has a row with light and dark values
- [ ] 14.2 Update the criteria rows in `docs/accessibility.md` for 1.3.1, 1.4.1, 1.4.3, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.2.2, 2.4.3, 2.4.11, 2.5.3, 2.5.8, 4.1.2 and 4.1.3, and the state count (25 states, 102 axe runs); verify each row names the e2e file that proves it
- [ ] 14.3 Update `README.md` for the list toolbar and chips, the empty state, the row Actions menu and list reset, the detail layout and save bar, Inter, and the Prettier plugin (with the note from task 1.2 if it applies); verify the README's endpoint table is unchanged
- [ ] 14.4 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` with port 4600 free, `npx prettier --check src e2e`, and `openspec validate modernize-ui-styling --strict`, and verify all pass
- [ ] 14.5 Commit this group as `docs: record the modernized UI styling in the accessibility report and README`
