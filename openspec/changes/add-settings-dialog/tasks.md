## 1. Grid spikes

- [x] 1.1 In the dev server, change `rowHeight` on the live users grid with `setGridOption` plus `resetRowHeights`, and with `refreshInfiniteCache`, and verify which re-lays the current page's rows without leaving the page; record the result in design.md if it differs from the plan
- [x] 1.2 Set rows to 48 px with WCAG text spacing applied at 320 px and verify no cell text is clipped, or raise the Compact height until it passes and record the value

## 2. Table settings state

- [x] 2.1 Add `TableSettingsService` with `striped`, `density` and `movableColumns` signals, JSON storage under `orbweaver-admin-table-settings` and defaults, and verify `table-settings.service.spec.ts` covers defaults, restoring stored values, ignoring bad or partial JSON, writing on change, and a throwing `localStorage`

## 3. Grid wiring

- [x] 3.1 Add the `--color-row-stripe` token with light and dark values and the `app-users-grid.striped .ag-row-odd` rule, bind the `striped` host class in `UsersGrid`, and verify cell text on the stripe meets 4.5:1 in both themes
- [x] 3.2 Move `rowHeight` from the theme params to the grid option driven by density, using the method from 1.1, and verify in the browser that switching density on `/users` page 3 changes row height and stays on page 3
- [x] 3.3 Bind `suppressMovableColumns` to the inverse of `movableColumns`, and verify `e2e/grid.e2e.ts` still finds columns fixed by default and adds a test that Email moves before Name after turning the setting on, with resizing still off

## 4. Settings dialog

- [x] 4.1 Add `SettingsDialog` with `show(opener)`, the heading, the Theme, Striped rows, Density and Draggable columns controls, Close, the `cancel` handler and focus return, and verify `settings-dialog.spec.ts` (with `stubDialogMethods`) covers opening, focus on the heading, Close and Escape returning focus to the opener, each control updating its service, the theme radios following `ThemeService`, and `expectNoAxeViolations`
- [x] 4.2 Add the data-driven WCAG note so it shows and joins the checkbox's `aria-describedby` only while Draggable columns is on, and verify unit tests check the note text names "2.5.7 Dragging Movements", its association, and its absence for every conforming value

## 5. Nav and shell

- [x] 5.1 Give `NavEntry` an action kind, render Settings as a button with `aria-haspopup="dialog"` that emits `openSettings`, and verify `top-nav.spec.ts` checks Settings is not disabled, has no "(not available yet)" text, emits on click, and that Dashboard and Reports are unchanged
- [x] 5.2 Render `SettingsDialog` in `App` and open it from `TopNav`'s output, and verify `app.spec.ts` opens the dialog from the Settings button and focus returns to it on close

## 6. Browser suite and docs

- [x] 6.1 Add `openSettingsDialog` to `e2e/support/app.ts` and the open dialog to the `axe.e2e.ts` and `layout.e2e.ts` states, and verify both pass in both themes at 1280 and 320 px
- [x] 6.2 Add keyboard tests for Tab to Settings, Enter, focus on the heading, Tab staying inside, and Escape returning focus to Settings, plus a test that a changed setting survives a reload and one that blocked storage still applies it, and verify they pass
- [x] 6.3 Update the placeholder keyboard and nav e2e expectations for Settings, and verify `npm run test:a11y` passes in full
- [x] 6.4 Update `docs/accessibility.md` (scope, 2.4.3, 2.5.7 with the known gap, 4.1.2, the Decisions section on columns, and the state count) and `README.md`, and verify every changed row names its evidence and neither file has an em dash
- [x] 6.5 Verify `ng test --watch=false`, `ng build`, `npm run test:a11y`, `npx prettier --check src e2e` and `openspec validate add-settings-dialog --strict` all pass, and check in the browser at 1280 and 320 px in both themes that the dialog opens from Settings, every setting changes the list at once, and the 2.5.7 note appears only with Draggable columns on
