## Why

The "improve ui styling to a modern look" task has no spec yet. On 2026-09-16 the user decided every small and medium item in `docs/ui-styling-ideas.md`, so the app can take on the look of current admin tools (Linear, Vercel, Stripe, Tailwind's Catalyst) without giving up the WCAG 2.2 AA results the suite already proves.

## What Changes

Small visual changes:
- The user grid shows Status as green, amber and red pills and Role as neutral pills. The word always stays inside the pill.
- Each name in the grid gets an initials avatar, colored from a fixed set of tokens and hidden from screen readers.
- Every screen title gets a one-line description under it. On the user list, New user stays on the right of the title row.
- The user table and the detail screen's sections sit in `rounded-xl` cards with a light border and a soft shadow, drawn from new radius and shadow tokens.
- Inter becomes the UI typeface. The app self-hosts it from an npm package, and counts and paging use tabular numbers.

Medium changes:
- The user list gets a filter toolbar with search, Role and Status. Each active filter shows as a removable chip, and "Clear all" removes them all. Table settings moves to the table card's top-right, outside the toolbar.
- Skeleton rows show while a page loads. "Loading users…" stays for screen readers but is now visually hidden, and the skeleton does not pulse under reduced motion.
- A search or filter that matches nothing shows an empty state with a heading, one line of help and a Clear filters button.
- Each grid row gets an Actions menu with View and Reset password. It follows the Theme menu's keyboard pattern, and Reset password opens the existing confirmation dialog.
- The detail screen uses two columns at 1024 px and wider: the form card on the left, the Password and Demo cards on the right. Below 1024 px it uses one column. Save and Cancel sit in a bar that stays in view while there are unsaved edits.
- The header becomes light and surface-colored, with a 1 px bottom border in both themes, and keeps the current-screen underline. The header's dark-only color tokens go away.

Tailwind practices:
- The project adds `prettier-plugin-tailwindcss`, so class lists sort the same way everywhere.
- Repeated bracket values become tokens or named utilities.
- The palette keeps its current values. No `oklch` migration.

Out of scope: the sidebar layout, the command palette and bulk selection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-list`: badges keep their words in "User columns"; "Navigate to user detail" leaves the Actions cell out of Enter-to-open; "Loading state" names skeleton rows; "Search result announced" is replaced by "Result and loading announcements", which hides "Loading users…" visually; new requirements cover filter chips with Clear all, the empty result state, and the row Actions menu.
- `password-reset`: a new requirement covers sending a reset from the user list's row menu.
- `user-management`: a new requirement covers the save bar that stays in view while there are unsaved edits.
- `settings-dialog`: "Open table settings from the user list" places the button at the table card's top-right, outside the filter toolbar.
- `accessibility`: "Full keyboard operability" names the row menu and filter chips, "Sufficient color contrast" adds badges and avatars, and "Focus not obscured" adds the save bar.
- `runtime-quality`: "No console errors or warnings" adds the chips, Clear all, the empty state and the row menu to the flows that must log nothing.

## Impact

- `src/styles.css`: new tokens for badges, avatars, skeletons, card borders, shadows and radius; the header tokens removed; the Inter `@font-face`; a `w-dialog` utility and a `tall` variant.
- `package.json`: `@fontsource-variable/inter` (5.3.0, OFL-1.1) as a dependency and `prettier-plugin-tailwindcss` (0.8.1) as a dev dependency. `.prettierrc` loads the plugin. `angular.json` copies the Inter font files, and `src/index.html` preloads one of them.
- `src/app/app.ts`, `src/app/layout/top-nav.ts`, `nav-drawer.ts` and `theme-switcher.ts`: the light header.
- `src/app/users/users-page.ts`, `users-grid.ts` and `user-name-cell.ts`, plus new components for the badge, actions, skeleton and empty state cells, the filter chips and the row menu.
- `src/app/users/user-detail-page.ts`, `new-user-page.ts` and `src/app/about/about-page.ts`: descriptions, cards and the detail layout. The three dialogs switch to `w-dialog`.
- Every component template gets its class list re-sorted once by the Prettier plugin.
- Unit specs for each touched component, and `e2e/axe.e2e.ts`, `layout.e2e.ts`, `keyboard.e2e.ts`, `filter.e2e.ts`, `search.e2e.ts`, `settings.e2e.ts`, `console.e2e.ts` and `e2e/support/app.ts`, plus new e2e files for the row menu and the save bar.
- `docs/accessibility.md` (the Theme colors table, the criteria rows and the axe state count) and `README.md`.
- No change to the API layer or the in-memory store.
