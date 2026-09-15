## Context

`TopNav` gives Settings an `action: 'settings'` kind that renders a button with `aria-haspopup="dialog"` and emits it through `openSettings`. `App` renders `SettingsDialog` once after `<main>` and calls `show(opener)`, so the dialog exists on every screen.

`SettingsDialog` (`src/app/layout/settings-dialog.ts`) has a Theme group and a Table section. All its inputs share one `RADIO_CLASSES` string: `size-6 accent-primary` plus a focus outline. The controls are native, so the browser draws them. Under `:root[data-theme='dark']` the app sets `color-scheme: dark`, and `--color-primary` stays sky-700 in both themes. The user reports that unchecked radios read as selected in dark; the exact rendering has not been measured yet, so task 3.1 captures it before any change.

`UsersPage` puts the search in a `max-w-md` grid under the heading row. `TableSettingsService` reads one stored JSON value and falls back to `DEFAULTS` for a missing or invalid field.

## Goals / Non-Goals

**Goals:**
- The dialog lives with the table it configures and disappears from other screens.
- Controls that read the same in both themes without depending on the browser's form-control palette.
- A default change that does not override anything an admin already chose.

**Non-Goals:**
- A real Settings screen behind the nav entry.
- Restyling the header Theme switcher.
- Renaming the `settings-dialog` capability path or `TableSettingsService`.

## Decisions

**`UsersPage` owns the button and the dialog.** The search row becomes a `flex flex-wrap items-end justify-between gap` container holding the existing label and field on one side and a secondary-styled `<button type="button" aria-haspopup="dialog">Table settings</button>` on the other, `min-h-11` to match the field. `UsersPage` renders the dialog and calls `show(button)`. The component moves to `src/app/users/table-settings-dialog.ts` as `TableSettingsDialog`, since only the list uses it. Alternative: keep it in `App` and open it through a service, rejected because nothing outside the list needs it and a service adds a shared open state for one screen. Alternative: keep the old file name, rejected because the class name would then describe a dialog that no longer exists.

**Settings returns to a plain placeholder.** Remove the `action` field from `NavEntry`, the `@else if (entry.action === 'settings')` branch and the `openSettings` output, so Settings renders through the existing `aria-disabled` branch. `App` drops `SettingsDialog` and the `(openSettings)` binding. This is the pre-`add-settings-dialog` shape, so `top-nav.spec.ts` gets its placeholder cases back for Settings.

**Remove the Theme group outright.** `ThemeService` and `ThemeSwitcher` are unchanged; the dialog stops injecting `ThemeService`. The header control already covers first visit, arrow keys and System, and `e2e/theme.e2e.ts` tests it there.

**Draw the controls with `appearance-none` and tokens.** Each input gets `appearance-none`, a 2 px `border-line-input` outline, `bg-surface`, and a checked state from Tailwind's `checked:` variant: the radio fills a centered dot with `checked:bg-primary` plus an inset `box-shadow` ring in `surface`, and the checkbox fills `bg-primary` with a check drawn by a CSS mask. `line-input` is slate-500 in light and slate-400 in dark, and both should clear 3:1 on their dialog surface; task 3.3 records the measured ratios. Split `RADIO_CLASSES` into `RADIO_CLASSES` and `CHECKBOX_CLASSES`, since the marks differ. Alternative: keep native controls with `color-scheme: light` on the inputs, rejected because a light control inside a dark dialog looks out of place and still depends on Chrome's drawing. Alternative: a dark-theme `accent-color`, rejected because it only tints the checked state.

**Resizable columns follows the Draggable columns pattern.** `TableSettingsService` gains `resizableColumns` (default `false`), read and validated per field like the others, so a stored value without it gets the default. `UsersGrid` binds `defaultColDef.resizable` to it through `setGridOption('defaultColDef', ...)`, since `defaultColDef` is not reactive through the template. Role and Status get a `minWidth` (their current 120 and 130 px), and Name and Email keep 180 and 240, so a column can never shrink past two wrapped lines at the fixed row height; task 5.2 checks this under text spacing. `WCAG_FAILURES` gains `resizableColumns`, and the dialog shows its note with the same `aria-describedby` wiring. AG Grid's column sizing docs say Community resizes "by dragging the right edge of the column header or by using the keyboard" (Alt plus Left or Right on a focused header). That keyboard path meets 2.1.1 but 2.5.7 asks for a single-pointer alternative, so the setting still fails 2.5.7. The handoff's 2026-09-13 note that AG Grid offers only dragging for resizing is out of date for 36.x. Alternative: add single-pointer width buttons so resizing conforms, rejected for the same reason Move buttons were rejected for Draggable columns on 2026-09-15.

**Fixed header bounds the grid's height instead of making its header sticky.** With the setting on, `UsersGrid` sets `domLayout` to `normal` and gives the host a height of `max(20rem, calc(100dvh - <offset>))`, so AG Grid scrolls rows inside its own viewport under a header that never moves, and the paging panel sits below that viewport. With it off, `domLayout` stays `autoHeight`. AG Grid's grid options reference lists `domLayout` and `defaultColDef` without the Initial marker, so both can change at runtime through `setGridOption`. The 20rem floor keeps a few rows visible at 400 percent zoom, where the page itself then scrolls. Alternative: `position: sticky` on `.ag-header` with `autoHeight`, rejected because AG Grid sets `overflow: hidden` on its root wrappers, which stops sticky from reaching the page scroll, and the workarounds in AG Grid issues #6421, #8006 and #13403 override internal classes with `overflow: unset` or `clip`. Those would break on an AG Grid upgrade.

**Change `DEFAULTS.density` only.** A stored value already wins over `DEFAULTS`, so a browser that stored Comfortable keeps it, and one that stored nothing gets Compact. No migration code.

**Edit the main spec's Purpose at archive.** A delta cannot change Purpose, so after archive `openspec/specs/settings-dialog/spec.md`'s Purpose is rewritten to describe a table settings dialog opened from the user list, without theme.

## Risks / Trade-offs

- [Every e2e helper that opens the dialog goes through the nav] → `e2e/support/app.ts` `openSettingsDialog` opens the list first and clicks Table settings; the axe and layout suites drop their About and detail-screen dialog states, since the dialog no longer exists there.
- [At 320 px the search row gets tighter] → the row wraps, putting the button under the field; the layout e2e checks reflow and 24 px targets at 320 px.
- [e2e tests that assume 64 px rows by default now see 48 px] → `e2e/settings.e2e.ts`'s density test starts from Compact and switches to Comfortable.
- [Fixed header adds a scroll area inside the page, so a mouse wheel over the grid scrolls rows first] → accepted as the cost of the setting, which is off by default; arrow keys already move through cells and AG Grid scrolls the focused row into its viewport below the header, which the new "Rows under a fixed header" scenario checks.
- [The height offset depends on the header and search row above the grid, which wrap differently at 320 px] → pick the offset from the 1280 px layout and let the 20rem floor cover narrow screens; the layout e2e checks reflow and focus visibility with Fixed header on at 1280, 320 and 320 by 256 px.
- [AG Grid turns off `flex` on a column once it is resized, so Name and Email stop filling the width after a resize] → widths reset on reload since they are not remembered, matching column order; recorded as expected behavior, not a bug.
- [Custom-drawn controls lose forced-colors rendering] → add `forced-colors:appearance-auto` and check once in Chrome's forced-colors emulation.
- [`fix-search-match-count` also edits `users-page.ts`] → whichever change is applied second rebases onto the first; they touch different parts of the template (count and status line versus the search row).
