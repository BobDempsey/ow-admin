## Context

`ConflictDialog` (`src/app/users/conflict-dialog.ts`) sets the app's dialog practice: a native `<dialog>` opened with `showModal()` through a public `show()` method (not an input, which missed a reopen before a render), `aria-labelledby` and `aria-describedby`, focus moved to a chosen element on open, a `cancel` listener so Escape runs the same path as a button, closing itself before emitting, and the caller moving focus back afterwards. Unit tests call `stubDialogMethods()` from `src/testing/dialog.ts`, since jsdom has no `showModal` or `close`. The browser suite opens it through `openConflictDialog` and checks axe, reflow, text spacing and zoom on it.

`TopNav` renders `NAV_ENTRIES`: entries with a `path` become links, the rest `aria-disabled` buttons. `UsersGrid` sets `rowHeight: 64` in its AG Grid theme params, passes `[suppressMovableColumns]="true"`, and has no column resizing. `ThemeService` (from `add-theme-switcher`, committed and not archived) holds the theme preference and storage. See proposal.md for why and `specs/` for behavior.

## Goals / Non-Goals

**Goals:**
- One dialog component reused on every screen, following the `ConflictDialog` pattern.
- Table settings that update a grid already on screen.
- A single, data-driven way to attach a WCAG note to a setting value, so a future non-conforming setting gets one without new markup.

**Non-Goals:**
- Remembering column order, column widths, or page size.
- Column resizing, column hiding, or a keyboard alternative for moving columns (the user chose drag only, with a note).
- Settings sync across tabs or devices.
- Turning Dashboard or Reports into working entries.

## Decisions

- **`SettingsDialog` lives in `src/app/layout/settings-dialog.ts` and `App` renders it once**, outside `<main>`, so it is available on every screen. `TopNav` gains an `openSettings` output; `App` calls `settingsDialog.show(opener)`. Rendering it inside `TopNav` was considered, but the header's dark-only tokens would leak into the dialog and the nav would own unrelated state.
- **Nav entries get a third kind.** `NavEntry` becomes a union: `{ label, path }` for links, `{ label, action: 'settings' }` for the Settings button, and `{ label }` for placeholders. The Settings button has `aria-haspopup="dialog"` and the nav's link styling minus `aria-current`.
- **Focus:** `show(opener)` records the opener, calls `showModal()`, and focuses the dialog's `<h2 tabindex="-1">Settings</h2>`, so a screen reader hears the title before the first control. A single `close()` path (Close button and the `cancel` event, with `preventDefault` then `close()`) returns focus to the recorded opener. Unlike `ConflictDialog` the dialog restores focus itself, because its opener is always the same kind of element and nothing downstream needs a choice.
- **Layout:** the heading, a "Theme" `fieldset` of three native radios named `settings-theme` (not `theme`, which would join the header's radio group), a "Table" section with a Striped rows checkbox, a "Density" `fieldset` of Comfortable and Compact radios, a Draggable columns checkbox, and Close at the bottom. Dialog classes follow `ConflictDialog` (`bg-surface`, `text-ink`, `backdrop:bg-backdrop/60`, `w-[calc(100%-2rem)] max-w-lg`) plus `max-h-[calc(100dvh-2rem)] overflow-y-auto` so it scrolls inside itself at 320 px and 200 percent zoom.
- **`TableSettingsService` (`src/app/core/table-settings.service.ts`, `@Service`)** holds `striped`, `density` and `movableColumns` signals, loaded from and saved to one JSON value under `localStorage['orbweaver-admin-table-settings']`, with every storage call in `try`/`catch` and unknown or missing fields falling back to defaults. It writes only when a setting changes, like `ThemeService`. A single JSON key keeps defaults and migration in one place. The theme stays in `ThemeService`, so the header control and the dialog share one signal.
- **WCAG notes are data.** Each setting option can carry `wcagFailure?: { criterion: '2.5.7 Dragging Movements'; text: string }`. The dialog renders a note with an id and adds it to that control's `aria-describedby` only while the failing value is selected. Only `movableColumns: true` has one: "Fails WCAG 2.5.7 Dragging Movements: columns can then be moved only by dragging, with no keyboard or single-pointer alternative." A plain text note with a warning label is used, not `role="alert"`, because it describes a state rather than an event; its appearance next to the checkbox the admin just changed is announced through the description.
- **Grid wiring:**
  - Striped rows: `UsersGrid` binds a host class `striped` from the service, and `src/styles.css` adds `app-users-grid.striped .ag-row-odd { background-color: var(--color-row-stripe); }` with a new `--color-row-stripe` token (light slate-50, dark slate-800). CSS on the row class was chosen over swapping AG Grid themes, which would re-create the theme object and restyle the whole grid.
  - Density: `rowHeight` moves from the theme params to the `[rowHeight]` grid option (64 Comfortable, 48 Compact). On change the grid calls `api.setGridOption('rowHeight', …)` then `api.refreshInfiniteCache()`, which re-lays the current page at the new height without leaving it (checked in task 1.1 on page 3). `api.resetRowHeights()` is not an option: AG Grid logs error #200 because it needs `ServerSideRowModelApiModule`, an Enterprise module. 48 px leaves room for two lines at AG Grid's 14 px font with 1.5 line height (42 px); the layout suite's text spacing check on Compact is the proof.
  - Draggable columns: `[suppressMovableColumns]` binds to `!movableColumns()`, and `suppressDragLeaveHidesColumns` stays true so a column dragged off the grid is not hidden. `resizable: false` stays in `defaultColDef`.
- **Conformance report:** 2.5.7 stays "Passes" for default settings, with the evidence noting the setting, and "Known gaps" gains one entry naming the Draggable columns setting and the list screen. The spec's report requirement says every known gap names its screen, which this entry does.
- **Browser suite:** `openSettingsDialog(page)` in `e2e/support/app.ts` opens it from `/users` by clicking Settings. `axe.e2e.ts` and `layout.e2e.ts` add it to their states, so it is checked in both themes at both widths. `grid.e2e.ts` keeps the 2.5.7 drag checks as the default case and adds an opted-in reorder test and a Compact text spacing test. `keyboard.e2e.ts` adds Tab to Settings, Enter, Tab cycling inside, and Escape returning focus.

## Risks / Trade-offs

- [Changing `rowHeight` on a live Infinite Row Model grid makes a new request for the current page] → Accepted: it is one `GET /users` for the page on screen, and the page number is kept (task 1.1).
- [Compact rows clip under text spacing at some width] → The layout suite runs text spacing and zoom on the list with Compact; if it clips, raise Compact's height until it passes and record the value.
- [The opt-in drag fails 2.5.7 while on] → Off by default, a WCAG note in the dialog, and a named known gap in the report; the user chose this over a keyboard alternative.
- [Two Theme radio groups on one page confuse assistive technology] → Different `name` values keep the groups separate, and the dialog is modal, so the header group is inert while it is open.
- [`add-theme-switcher` is not archived, so `theme-switcher` is not yet a main spec] → Archive it before archiving this change; this change adds no delta to `theme-switcher`.
- [Settings in the nav changes the keyboard e2e test that Tabs from Users past placeholders] → The test names entries explicitly; update it where Settings is no longer disabled.
