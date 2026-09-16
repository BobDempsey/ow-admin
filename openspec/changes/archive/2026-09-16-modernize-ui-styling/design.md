## Context

See proposal.md for why. The facts below shape how the work gets built.

- `src/styles.css` defines 31 color tokens in `@theme` and redefines them under `:root[data-theme='dark']`. Tailwind 4 reads `@theme` colors through `var()`, so the dark block restyles `bg-surface` with no `dark:` class. It also inlines shadow values into utilities and swaps their colors for `var(--tw-shadow-color, …)`, so redefining a whole `--shadow-*` token under the dark selector would not reach `shadow-*` classes. A color variable inside the shadow value does.
- The header is `bg-header` (slate-900 light, slate-950 dark) with a 1 px rule drawn as an inset shadow only in dark. `TopNav`, `NavDrawer` and `ThemeSwitcher` use six `header-*` tokens. The current-screen underline is `border-b-[3px]` with `aria-[current=page]:border-header-accent`.
- `UsersGrid` runs AG Grid Community 36.1 on the Infinite Row Model with one block per page (`maxBlocksInCache: 1`). Before a page answers, AG Grid renders stub rows and calls each cell renderer with `data` undefined; `UserNameCell` renders nothing then. The grid is one Tab stop because `tabToNextCell` and `tabToNextHeader` return `false`. Enter on any cell opens the user (`onCellKeyDown`), and a row click opens the user unless the click was inside an `<a>`. Rows are 48 px (Compact, the default) or 64 px (Comfortable), fixed, with wrapping cell text. The Quartz theme params live in `users-grid.ts` as hex values. With Fixed header on, the host is `max(20rem, calc(100dvh - 19rem))` tall, where `19rem` (`GRID_HEIGHT_OFFSET`) is the space above and below the grid at 1280 px. The "no rows" message is `overlayNoRowsTemplate`, a string.
- `UsersPage` holds the search (typed and committed), Role and Status as signals, builds `query`, and shows one `role="status"` line whose "Loading users…" is visible and whose result text is `sr-only`. Table settings sits in the same flex row as the filters.
- `ThemeSwitcher` is the house menu button: `aria-haspopup="menu"`, a menu rendered only while open, a roving `tabindex`, Escape returns focus to the button, and Tab closes the menu and leaves focus on the item, because the menu follows the button in the DOM.
- `ResetPasswordDialog` takes `name` and `email` inputs, opens with `show()` on Cancel, and emits `confirmed`. Only `UserDetailPage` uses it today. jsdom has no `showModal` or `close`; `stubDialogMethods()` covers that.
- `UserDetailPage` renders the form, then the Password section, then a dashed Demo section, all in one column. The draft is a `linkedSignal` of the loaded value, so a save or reload resets it.
- The e2e suite runs axe and the layout checks over 20 states at 1280 and 320 px in both themes (82 axe runs with the drawer), and `e2e/support/test.ts` fails any test that logs a console error or warning.
- `@fontsource-variable/inter` is at 5.3.0 on npm (OFL-1.1) and publishes the family as "Inter Variable". `prettier-plugin-tailwindcss` is at 0.8.1 and needs Prettier 3, which the project has (3.8).

## Goals / Non-Goals

**Goals:**
- Each decided item lands as its own commit that builds, passes its tests and leaves the app working, so it can be reverted on its own.
- Every new color pair is measured in both themes and meets 4.5:1 for text and 3:1 for meaningful non-text.
- The grid stays a single Tab stop, and every existing keyboard path keeps working.

**Non-Goals:**
- Any change to the API layer, the in-memory store or the list request shape.
- An `oklch` palette, container queries or `prefers-contrast` styles.
- Remembering the row menu or chip state across reloads.
- Changing row heights, the header height or the page sizes.
- Icons in the Theme menu.

## Decisions

### Tokens and colors

**New tokens, all in `src/styles.css`, with one light and one dark value each.** Light and dark values below are Tailwind palette variables, as the existing tokens are. Ratios are estimates from the palette's hex values; task 2.3 measures the rendered colors in Chromium, and the docs group records the measured values.

| Token | Light | Dark | Used for | Pair and estimate (light / dark) |
| --- | --- | --- | --- | --- |
| `line-subtle` | slate-200 | slate-700 | Card borders, header bottom border | Decorative: 1.2 / 1.7, no minimum |
| `shadow` | `rgb(15 23 42 / 0.08)` | `rgb(0 0 0 / 0.5)` | Color inside `--shadow-card` | Decorative |
| `skeleton` | slate-200 | slate-700 | Skeleton bars | Decorative: 1.2 / 1.7, no minimum |
| `status-active-surface`, `-ink`, `-line` | green-50, green-800, green-200 | green-950, green-200, green-800 | Active pill | Ink on surface: 6.8 / 12.3 |
| `status-invited-surface`, `-ink`, `-line` | amber-50, amber-800, amber-200 | amber-950, amber-200, amber-800 | Invited pill | 6.8 / 12.0 |
| `status-suspended-surface`, `-ink`, `-line` | red-50, red-800, red-200 | red-950, red-200, red-800 | Suspended pill | 7.6 / 11.2 |
| `avatar-1-surface`, `avatar-1-ink` | sky-100, sky-800 | sky-900, sky-200 | Initials | 6.6 / 7.1 |
| `avatar-2-…` | violet-100, violet-800 | violet-900, violet-200 | Initials | 7.6 / 7.9 |
| `avatar-3-…` | emerald-100, emerald-800 | emerald-900, emerald-200 | Initials | 6.8 / 7.6 |
| `avatar-4-…` | amber-100, amber-800 | amber-900, amber-200 | Initials | 6.4 / 7.3 |
| `avatar-5-…` | rose-100, rose-800 | rose-900, rose-200 | Initials | 6.7 / 6.8 |
| `avatar-6-…` | slate-200, slate-800 | slate-700, slate-200 | Initials | 11.9 / 8.4 |
| `nav-current` | sky-700 | sky-400 | Current-screen underline | 3:1 needed: 5.9 on surface, 5.4 on hover / 8.3 and 6.8 |

The role pill reuses `surface-muted`, `ink-muted` and `line` (9.5 / 9.9), because a neutral pill is exactly what those tokens already mean. Pill borders are decorative: every pill is identified by its word, which is how 1.4.11 is already recorded for secondary buttons. In light, `surface-muted` equals the stripe color, so a role pill on a striped row relies on its border to stand apart; its text contrast is measured against its own fill, which does not change.

`--radius-card: var(--radius-xl)` and `--shadow-card: 0 1px 2px 0 var(--color-shadow), 0 1px 3px 0 var(--color-shadow)` give `rounded-card` and `shadow-card`. The shadow reads its color from `--color-shadow`, so the dark block only redefines that color. Task 2.3 checks that the computed `box-shadow` differs between themes.

**The header's tokens go away.** The header becomes surface-colored in both themes, so `header`, `header-hover`, `header-ink`, `header-muted`, `header-focus`, `header-accent` and `header-line` are removed, and the header, nav, drawer and Theme button use the general tokens: `bg-surface`, `text-ink` (17.9 / 16.3), `hover:bg-surface-muted` (16.3 / 13.4), `text-ink-subtle` for placeholder entries (7.6 / 7.0), `outline-focus` (5.9 / 8.3), `border-line-subtle` for the bottom border, and the new `nav-current` for the underline. The header's own dark values (slate-950 fill, white text, slate-300 placeholders, a rule drawn only in dark) disappear, and the bottom border shows in both themes. The drawer's Close button takes the secondary button style (`border-line`). Alternative: keep the `header-*` names and point them at surface values, rejected because two names for one color break the one-name-per-thing rule the tokens follow. `--color-backdrop` stays.

**Measuring.** The `contrast()` helper in `e2e/settings.e2e.ts` moves to `e2e/support/contrast.ts`. A new `e2e/contrast.e2e.ts` reads the rendered colors in both themes and asserts each pair above: the three status pills, a role pill on a plain and a striped row, one avatar of each of the six colors, header text, placeholder entries, the focus ring and the underline on the header and its hover fill. axe's `color-contrast` also covers the pill and header text in every axe state. The docs group copies the measured values into the Theme colors table and marks decorative pairs "no minimum".

### Tailwind practice

**`prettier-plugin-tailwindcss` in its own first commit.** `.prettierrc` gets `"plugins": ["prettier-plugin-tailwindcss"]` and `"tailwindStylesheet": "./src/styles.css"`, so the plugin knows the custom utilities. One `npx prettier --write src e2e` re-sorts every class list, and that commit holds nothing else, so the sort never hides a real change in a later diff. Task 1.2 checks that the plugin sorts class lists inside the inline `template` strings; if it only sorts `.html` files, the plugin stays and the README says so.

**Repeated bracket values.** Two repeat today: `w-[calc(100%-2rem)]` in the three dialogs becomes a `@utility w-dialog`, and `border-b-[3px]` in `TopNav` becomes `border-b-3`, which Tailwind 4 accepts as a bare value. The dark-only `shadow-[inset_0_-1px_0_var(--color-header-line)]` goes away with the header change. Single-use values stay. New code uses no bracket values: the detail layout uses `lg:grid-cols-3`, and the save bar's height rule uses a `@custom-variant tall (@media (min-height: 30rem))`.

### Typeface

**Inter Variable, served from the app's own origin.** `@fontsource-variable/inter` becomes a dependency. An `angular.json` asset entry copies `inter-latin-wght-normal.woff2` and `inter-latin-ext-wght-normal.woff2` from the package's `files` folder to `/fonts/` (task 3.1 confirms the file names after install). `src/styles.css` declares the two `@font-face` rules itself with `font-display: swap`, `font-weight: 100 900` and the package's `unicode-range` values, instead of importing the package CSS, because Angular would hash the imported file names and a preload needs a stable URL. `src/index.html` preloads the latin file with `<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>`; the `crossorigin` attribute has to be there, or Chromium fetches the font twice and warns that the preload went unused, which the console guard would fail. `@theme` sets `--font-sans: 'Inter Variable', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif`, and Tailwind's base styles apply it to the page; the grid already inherits the font. An `Inter Fallback` face over `local('Arial')` with `size-adjust`, `ascent-override` and `descent-override` keeps the text the same size while the font loads, so a slow load swaps without moving the layout. Starting values are 107.4 %, 90.2 % and 22.5 %; task 3.2 tunes them by comparing screenshots with the font blocked. The latin range covers accented names such as "Spärck".

Alternatives: `font-display: optional`, rejected because a cold load would keep the fallback for the whole visit; importing `@fontsource-variable/inter` in CSS, rejected for the hashed URLs; a Google Fonts link, rejected because the decision is to self-host.

**Tabular numbers** (`tabular-nums`) go on the total beside the heading, the detail screen's ID line, and AG Grid's paging panel through a rule in `src/styles.css` on `app-users-grid .ag-paging-panel`.

### Header, titles and cards

**Light header.** `App`'s `<header>` becomes `border-b border-line-subtle bg-surface`. `TopNav`, `NavDrawer` and `ThemeSwitcher` switch to the general tokens listed above. The underline keeps its 3 px width, its bold text and `aria-current`.

**One-line descriptions.** Each screen keeps its `<h1 tabindex="-1">` and gets a `<p class="text-ink-muted">` right after its title row:
- Users: "Find a user by name or email, or narrow the list by role and status." The title row keeps the total beside the heading and New user on the right.
- New user: "Add a user and choose their role and status."
- User detail, while loaded: "Change this user's details, or send a password reset email." The ID line moves into the form card.
- About already has a lead paragraph, which takes the same style.

No description shows beside "User not found" or a load failure. The create and detail screens keep their submit buttons in the form, since moving them to the title row would separate them from the fields they submit.

**Cards** are `rounded-card border border-line-subtle bg-surface shadow-card`. On the list, one card holds the toolbar row, the chip row, the status line, the list alert and the grid. The grid sits flush inside it: the Quartz params gain `wrapperBorder: false` and `wrapperBorderRadius: 0`, and the card uses `overflow-clip` to round the grid's corners. `overflow-clip` is chosen over `overflow-hidden` because a hidden overflow makes the card a scroll container, and `UsersGrid`'s `scrollIntoView` could then scroll the card instead of the page. On the detail screen, the form, Password and Demo sections each become a card. The form card gets an `h2` "Details" above the ID line. Demo keeps its dashed `border-line-strong` edge to mark it as a testing aid. The create screen's form also goes in a card, so the two screens that share `UserFormFields` look alike. `GRID_HEIGHT_OFFSET` is re-measured whenever a group changes the space above the grid, and the existing fixed-header layout tests check it.

### Badges and avatars in the grid

**Cell renderers in the style of `UserNameCell`.** A new `UserPillCell` (`src/app/users/user-pill-cell.ts`) renders a `<span>` pill for the Role and Status columns, picked through `cellRendererParams: { kind: 'role' | 'status' }`. Class lists for each status are complete strings in one constant, so Tailwind finds them. The pill is `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap`, about 20 px tall, and 22 px under WCAG text spacing. The word is the cell's text, so screen readers and `getByRole('gridcell')` read "suspended" as before.

**`UserNameCell` gains the avatar.** It renders `<span aria-hidden="true">` with the initials in a 32 px circle (`size-8 rounded-full text-xs font-semibold`), then the link, in an `inline-flex items-center gap-2 min-w-0` row. The link keeps `break-words`, so a long name still wraps to two lines. Two pure functions in `src/app/users/user-avatar.ts` do the work: `initialsOf(name)` takes the first code point of the first and last words and upper-cases them in `en-US`, and `avatarColorIndex(id)` sums the id's character codes modulo 6. The id never changes, so the color stays the same on every page and load. The six class pairs are complete strings in one constant.

**Row height and spacing.** Rows stay 48 and 64 px. A two-line name at 14 px with WCAG line height 1.5 needs 42 px, which fits beside the 32 px circle in a 48 px row. The pill needs 22 px. The wider content moves two column minimums: Name from 180 to 220 px (circle plus gap) and Status from 130 to 140 px, since "suspended" with 0.12 em letter spacing needs about 94 px inside the cell padding. `e2e/layout.e2e.ts`'s clipped-text check under text spacing and `e2e/grid.e2e.ts`'s Compact check prove it.

### Filter toolbar and chips

**Markup.** The toolbar row is a flex row inside the table card. Its first child is `<div role="search" aria-label="Filter users">` holding Search users, Role and Status, unchanged. Its second child is Table settings with `ml-auto`, so it sits in the card's top-right corner and wraps below the filters at 320 px. `role="search"` on a `div` is used rather than the `<search>` element, because jsdom does not map the element to the role. While any filter is active, a second row follows with `<ul aria-label="Active filters">` of chips and a Clear all button. DOM order matches reading order: Search users, Role, Status, Table settings, chips, Clear all, then the grid.

**Chips.** `UsersPage` derives `chips` with `computed()` from the committed `search()`, `role()` and `status()`, in that order, each with a key, a label ("Role: Admin") and a remove action. Each chip is a `<button>` whose content is `<span class="sr-only">Remove filter </span>` plus the label and an `aria-hidden` × icon, so the accessible name is "Remove filter Role: Admin" and contains the visible label (2.5.3). A chip is `min-h-8 rounded-full border border-line bg-surface-muted` with `text-sm`; its border is decorative, like a secondary button's. Clear all is a text-styled `<button>` with `min-h-8`. The chip row gets its own component, `FilterChips` (`src/app/users/filter-chips.ts`), with a `chips` input and `remove` and `clearAll` outputs, to keep `users-page.ts` small.

**Removing.** Removing the search chip sets `searchText` and `search` to `''` together, so the debounce effect sees nothing to wait for. `clearAll()` sets all four signals in one synchronous block, so `query` changes once and the grid sends one request. Both set `announceNextLoad`, which keeps the existing result announcement.

**Focus.** Focus moves in `afterNextRender`, after the chip leaves the DOM: to the chip now at the removed chip's index, else the new last chip, else the Search users field. Clear all always focuses Search users, since its own button disappears. The search field is chosen over the heading because it is where the admin most likely starts over, and it is the first control of the same group.

**Alternative:** `role="toolbar"`, rejected because it implies arrow-key movement between controls, and arrow keys inside a text field and a select already mean something else.

### Skeleton rows

**A skeleton renderer on the default column definition.** `defaultColDef` gains `cellRendererSelector: (params) => params.data ? undefined : { component: SkeletonCell, params: { shape } }`. AG Grid falls back to the column's own `cellRenderer` when the selector returns `undefined`, so the skeleton applies to every column, including ones added by later groups, without editing them. `SkeletonCell` (`src/app/users/skeleton-cell.ts`) draws `aria-hidden` bars in `bg-skeleton` with `motion-safe:animate-pulse`: a circle and a bar for Name, a wide bar for Email, a short rounded bar for Role and Status, and nothing for Actions. The shape comes from the column's `colId` through a lookup in the component.

AG Grid's `loadingCellRenderer` column option was considered; AG Grid documents it for the Server-Side Row Model, and the selector works with the renderer calls this row model already makes.

**Only while loading.** A failed block leaves its stub rows in place, so the bars read the grid's loading state from AG Grid's `context` (`{ loading: Signal<boolean> }`) and render nothing when no request is in flight. A failed page shows empty rows beside the alert, never pulsing bars.

**A full page of skeletons on the first load.** `infiniteInitialRowCount` becomes the page size, so the first load shows 25 stub rows instead of AG Grid's default of 1. After the first answer, AG Grid knows the row count, and later pages show a full page of stubs by themselves. A density reload uses `refreshInfiniteCache()`, which keeps the loaded rows on screen, so the quiet reload shows no skeleton.

**"Loading users…" becomes visually hidden,** inside an `sr-only` span in the same status line, and the line loses its `min-h-6`, since it no longer shows text of its own. Motion: `animate-pulse` is a 2 s opacity cycle that stops when the page loads, and a load with the 250 ms latency is far shorter than the 5 s that 2.2.2 counts from. `motion-safe:` removes it under reduced motion.

### Empty state

**AG Grid's no-rows overlay with an Angular component.** `EmptyUsersOverlay` (`src/app/users/empty-users-overlay.ts`) replaces `overlayNoRowsTemplate` through `noRowsOverlayComponent`. It renders an `h2`, one line of help and, while filtered, a Clear filters button:
- Filtered: "No users match", "Try a different search or filter, or clear them to see every user.", and Clear filters.
- Not filtered: "No users yet" and "Create a user to see them here." with no button.

`UsersGrid` passes `filtered` (from its `query` input) and a `clearFilters` callback through the overlay params, and emits a new `clearFilters` output, which `UsersPage` handles with the `clearAll()` from the toolbar group, focus included.

AG Grid draws overlays inside its root wrapper, between the body and the paging panel, so Tab from the grid reaches Clear filters before the paging controls. Task 11.1 checks in the browser that no ancestor of the button carries `aria-hidden` or `pointer-events: none`, and that Tab reaches it. If either check fails, the fallback is `suppressNoRowsOverlay: true` with `UsersPage` rendering the same component in the card directly below the grid. The specs hold either way.

### Row Actions menu

**An Actions column.** `{ colId: 'actions', headerName: 'Actions', cellRenderer: UserActionsCell, width: 104, sortable: false, resizable: false, lockPosition: 'right' }`. `lockPosition` keeps it last when Draggable columns is on. `UserActionsCell` renders a 32 px button with a three-dot `aria-hidden` icon, `tabindex="-1"`, `aria-haspopup="menu"`, `aria-expanded` and `aria-label="Actions for {name}"`. It has no visible text, so 2.5.3 has nothing to match.

**Keyboard access keeps the grid one Tab stop.** The button is never a Tab stop. The admin arrows to the Actions cell, where AG Grid's cell focus ring shows. `onCellKeyDown` checks `event.column.getColId() === 'actions'`: Enter or Space prevents the default and opens the menu, and nothing else opens the user from that cell. A click on the button opens the menu through `context.openActions(user, button, rowIndex)`, and `onRowClicked` now ignores clicks inside `a` or `button`. Down Arrow on the cell keeps moving to the next row, because the grid owns that key; this is the one place the pattern differs from the Theme button.

**The menu lives outside the grid.** `RowActionsMenu` (`src/app/users/row-actions-menu.ts`) is rendered by `UsersGrid` after `<ag-grid-angular>` and only while open, as `role="menu"` with `aria-label="Actions for {name}"`. Row cells clip their content and sit in rows moved with `transform`, so a menu inside a cell would be cut off and a `position: fixed` menu inside a row would be placed relative to that row. Outside the grid, `position: fixed` places it relative to the viewport. It opens below the button and right-aligned to it, flips above when the space below is shorter than the menu, and is clamped 8 px inside the viewport. It follows the Theme menu: items with a roving `tabindex`, focus on View when it opens, Down and Up Arrow with wrap, Home and End, Enter and Space, Escape, and a document `pointerdown` outside closes it. View is `<a role="menuitem" [routerLink]>`; Space on it navigates through the router, since Space does not follow a link. Reset password is `<button role="menuitem">`. Items are `min-h-11`.

**Tab differs from the Theme menu on purpose.** The Theme menu leaves focus on the item and lets the browser move on, because its popup follows its button in the DOM. This menu follows the whole grid, and the next Tab stop after it is outside the list, so Tab and Shift+Tab prevent the default, close the menu and return focus to the Actions cell through `api.setFocusedCell(rowIndex, 'actions')`. The next Tab then leaves the grid as it always does. Window `resize` and a captured `scroll` also close the menu, returning focus to the cell when focus was inside the menu, so the menu never floats away from its row.

**Focus return.** `UsersGrid.focusActionsCell(rowIndex)` returns `false` when the row is not on the current page; callers then focus the list's `h1`.

### Password reset from the list

`UsersPage` renders one `ResetPasswordDialog` bound to a `resetTarget` signal and handles a new `resetPassword` output from `UsersGrid` carrying the user and row index. Only one reset runs at a time: while one runs, choosing Reset password in any row opens nothing, and the visible status text already says an email is on its way. The status line shows, in order of priority: "Loading users…" (hidden), "Sending password reset email to {name}…" (visible), "Password reset email sent to {name}." (visible), and the result announcement (hidden). A list load starting clears the reset text. A failure shows a second `role="alert"` block in the card, "The password reset email to {name} could not be sent.", with Try again, which resends without the dialog and then moves focus like a close does. `UsersService.resetPassword` is reused. The grid is never refreshed. The earlier non-goal "a reset action on the user list" in the archived `add-password-reset-action` design no longer holds; the `password-reset` delta records the new place.

### Detail layout and save bar

**Two columns at `lg`.** The loaded content becomes `grid gap-6 lg:grid-cols-3`, with the form card at `lg:col-span-2` and an aside column (`grid content-start gap-6`) holding the Password and Demo cards. DOM order stays form, Password, Demo, so Tab order and the one-column order at narrower widths match.

**Unsaved means different values.** `unsaved = computed(() => loaded && !sameDraft(draft(), toDraft(loaded)))`. Comparing values rather than reading Signal Forms' `dirty()` means an edit typed back to the loaded value counts as saved, and a save or reload, which resets the `linkedSignal`, clears the state with no `reset()` call.

**The bar.** Save and Cancel move into a bar at the end of the `<form>`. It always holds `<p role="status">`, whose text is "Unsaved changes" while `unsaved()` is true and empty otherwise; the live region announces the text when it appears and stays quiet while the admin keeps typing, since the text does not change. Save gets `aria-describedby` pointing at it. While unsaved, the bar takes `tall:sticky tall:bottom-0 tall:z-10` with a top border, `bg-surface` and `shadow-card`, stretched to the card's edges with negative margins. Sticky positioning keeps the bar inside the `<form>`'s box, so it covers only the form's own controls, never the side cards or anything after the form. Below 480 px of viewport height, where the bar would take a quarter of a 400 percent zoom view, it stays in the flow.

**Focus not obscured (2.4.11).** While the bar is stuck, a rule `html:has([data-save-bar-stuck]) { scroll-padding-bottom: 6rem }`, inside the same media query, makes the browser scroll focused controls clear of the bar. The form also gets a host-style `(focusin)` handler that calls `scrollIntoView({ block: 'nearest' })`, which honors scroll padding, in case a browser's focus scrolling does not. The layout suite adds a state with unsaved edits and runs `obscuredFocusStops` at 1280 by 600 and 320 by 568, plus a check that no focused control's box intersects the bar's box.

### Tests that change

- `users-page.spec.ts`: "Loading users…" becomes hidden; the toolbar, chip, Clear all and focus cases; Table settings placement; the empty state output; the list reset flow with a stubbed grid that emits `resetPassword` and `clearFilters`.
- `users-grid.spec.ts`: the new column definitions, the skeleton selector, Enter and Space on the Actions cell, row clicks on the button, `focusActionsCell`, and the overlay params.
- `user-name-cell.spec.ts`: the avatar and its `aria-hidden`.
- New specs: `user-pill-cell.spec.ts`, `user-avatar.spec.ts`, `filter-chips.spec.ts`, `skeleton-cell.spec.ts`, `empty-users-overlay.spec.ts`, `user-actions-cell.spec.ts`, `row-actions-menu.spec.ts`.
- `user-detail-page.spec.ts` and `new-user-page.spec.ts`: descriptions, cards, the save bar and its status text.
- `top-nav.spec.ts`, `nav-drawer.spec.ts`, `theme-switcher.spec.ts`: class assertions, if any, move to the new tokens.
- `e2e/layout.e2e.ts`: the two Table settings placement tests use the card, and new checks cover the save bar, the row menu's position, the font and tabular numbers.
- `e2e/keyboard.e2e.ts`: the Tab counts include chips when filters are active; new flows cover chips, Clear all, Clear filters and the row menu.
- `e2e/filter.e2e.ts` and `e2e/search.e2e.ts`: "No users match your search or filters." becomes the empty state's heading and button; chip removal and Clear all requests.
- `e2e/settings.e2e.ts`: the contrast helper moves to `e2e/support/contrast.ts`; the status-text recorder still finds "Loading users…", which stays in the DOM.
- `e2e/console.e2e.ts`: chips, Clear all, the row menu and a list reset.
- New: `e2e/contrast.e2e.ts`, `e2e/row-actions.e2e.ts`, `e2e/save-bar.e2e.ts`.

New axe and layout states, added by the group that builds each one: "user list while a page loads (held through ng.getComponent)", "user list with a search and two filters", "user list with the row menu open", "user list with the password reset dialog", and "user detail with unsaved edits". The existing "user list with no search results" state now shows the empty state. That makes 25 states and 102 axe runs.

## Risks / Trade-offs

- [The Prettier plugin rewrites every template, and `git stash` or `git checkout --` on this machine writes CRLF that Prettier then rejects] → the sort is its own commit; after any stash, run `npx prettier --write src e2e`.
- [AG Grid may hide its overlay from assistive technology or from pointers] → task 11.1 checks it and the design names the fallback.
- [`infiniteInitialRowCount` at the page size makes the paging panel guess a row count before the first answer] → the guess lasts one request; task 10.2 checks the panel text after the load.
- [A `position: fixed` menu can drift if something scrolls while it is open] → scroll and resize close it and return focus.
- [Tab in the row menu returns to the cell instead of moving on, unlike the Theme menu] → recorded above and in the `user-list` delta; the next Tab leaves the grid.
- [The preload needs `crossorigin`, or Chromium fetches twice and warns] → the console guard fails any test that sees the warning, and task 3.2 checks the network log for one font request.
- [Fallback metric overrides are approximate] → task 3.2 compares screenshots with the font blocked and adjusts them.
- [Wider Name and Status minimums make the grid scroll sideways sooner at 320 px] → the grid's own sideways scroll is already allowed; the layout suite checks the page does not scroll.
- [The save bar could cover a control in a browser that ignores scroll padding on focus] → the `focusin` handler and the new layout check.
- [Estimated ratios differ slightly from Tailwind 4's `oklch` palette] → every text pair is estimated at 6.4:1 or higher, well above 4.5:1, and the contrast test measures the rendered values.
- [Removing the `header-*` tokens touches three layout components in one commit] → group 4 does all three together, and its revert restores them.
- [`overflow-clip` on the list card could cut a focus ring drawn outside a control at the card edge] → the toolbar row has padding, and the layout suite's focus checks run on every list state.

## Rollback

Each task group ends in one commit, in this order:

1. `chore(format): sort Tailwind classes with prettier-plugin-tailwindcss`
2. `refactor(styles): add card, pill, avatar and skeleton tokens and name repeated bracket values`
3. `feat(ui): self-host Inter as the UI typeface with tabular numbers`
4. `feat(ui): make the header light with a bottom border in both themes`
5. `feat(ui): add a one-line description under each screen title`
6. `feat(ui): put the user table and the detail sections in cards`
7. `feat(users): show role and status as pills in the user grid`
8. `feat(users): show an initials avatar beside each user name`
9. `feat(users): add removable filter chips and Clear all to the user list toolbar`
10. `feat(users): show skeleton rows while a page of users loads`
11. `feat(users): show an empty state with Clear filters when nothing matches`
12. `feat(users): add a row Actions menu with View and Reset password`
13. `feat(users): lay out the detail screen in two columns with a save bar that stays in view`
14. `docs: record the modernized UI styling in the accessibility report and README`

Dependencies between groups:
- Group 2's tokens are used by groups 4 (`line-subtle`, `nav-current`), 6 (radius, shadow, `line-subtle`), 7 (status tokens), 8 (avatar tokens) and 10 (`skeleton`). Group 2 only adds tokens and renames two bracket values, so it builds without them.
- Group 6's table card holds group 9's toolbar and chip rows, and group 13 lays out group 6's detail cards.
- Group 11's Clear filters calls group 9's `clearAll()`.
- Group 14 documents all of them.

Reverting the newest applied group always works. An older group reverts cleanly on its own unless a later applied group depends on it (revert 9 before 6, 11 before 9, 13 before 6, and 4, 6, 7, 8 and 10 before 2). Groups 7, 8, 10 and 12 all edit the column definitions in `users-grid.ts`, and groups 9 through 12 all edit `users-page.ts`, so reverting one of them out of order can need a small manual merge even where no logic depends on it. Group 1 only re-sorts classes; reverting it after later groups would conflict on nearly every template, and there is no reason to.

## Migration Plan

No data or storage changes. Stored theme and table settings keep working. The font files ship with the build, so no deploy step changes.
