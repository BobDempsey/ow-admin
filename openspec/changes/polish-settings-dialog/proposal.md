## Why

Three of the Settings dialog's four settings only change the user table, yet the dialog opens from the Settings nav entry on every screen, including About and the user screens where no table is on screen. Its Theme group repeats the header Theme control. In the dark theme its unchecked radios do not read as unselected, so an admin cannot tell Comfortable from Compact at a glance. And the user wants Compact rows by default.

## What Changes

- **BREAKING** The Settings nav entry stops opening a dialog and goes back to a disabled placeholder like Dashboard and Reports.
- A "Table settings" button on the user list, on the same row as the Search users field and across from it, opens the dialog. The dialog is renamed "Table settings" and closing it returns focus to that button.
- **BREAKING** The dialog's Theme group is removed. The header Theme control is the only place to choose a theme.
- The dialog's radios and checkboxes draw their own checked and unchecked states from color tokens, so an unchecked control is an empty outline and a checked one is filled, in both themes.
- Density defaults to Compact for a browser with no remembered settings. A browser that already stored Comfortable keeps it.
- A "Resizable columns" setting, off by default, lets the admin change column widths by dragging a header edge, or with Alt plus Left or Right on a focused header. Neither is a single-pointer alternative to dragging, so it fails WCAG 2.5.7 while on and the dialog says so, the same way Draggable columns does. The Draggable columns hint stops saying "Column widths stay the same."
- A "Fixed header" setting, off by default, keeps the column header visible while scrolling a page of rows. With it on, the grid takes a bounded height and scrolls its rows inside itself.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings-dialog`: the dialog opens from the user list instead of the nav, is named "Table settings", loses its Theme setting, defaults Density to Compact, adds Resizable columns and Fixed header with a 2.5.7 note for Resizable columns, and gains "Selected state visible in both themes". The capability keeps its path; its Purpose is edited at archive.
- `admin-navigation`: "Placeholder nav entries" is replaced by "Unavailable nav entries", which no longer exempts Settings. OpenSpec refuses a MODIFIED block that drops a scenario, so the rename carries the change.
- `accessibility`: "No drag-only interactions" allows a second opt-in drag setting, and "Focus not obscured" adds a fixed-header scenario.

## Impact

- `src/app/layout/top-nav.ts`: Settings loses its `action` and becomes a placeholder; the `openSettings` output goes.
- `src/app/app.ts`: no longer renders the dialog.
- `src/app/users/users-page.ts`: the Table settings button beside the search field, and the dialog.
- `src/app/layout/settings-dialog.ts`: title, no Theme group, control styling. It may move under `src/app/users/`.
- `src/app/core/table-settings.service.ts`: the default density and two new stored fields.
- `src/app/users/users-grid.ts`: `resizable` and `domLayout` bound to the settings, and minimum widths on every column.
- Tests: `top-nav.spec.ts`, `app.spec.ts`, `settings-dialog.spec.ts`, `table-settings.service.spec.ts`, `users-page.spec.ts`, and the e2e files that open the dialog from the nav (`e2e/support/app.ts`, `settings.e2e.ts`, `axe.e2e.ts`, `layout.e2e.ts`, `keyboard.e2e.ts`, `grid.e2e.ts`).
- Docs: `README.md`'s Settings paragraph and `docs/accessibility.md` rows that name the Settings entry or say grid rows are 64 px.
- `fix-search-match-count` says "Density in Table settings" to match.
- No API or store change.
