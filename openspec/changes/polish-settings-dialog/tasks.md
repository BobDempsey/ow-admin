## 1. Settings back to a placeholder

- [ ] 1.1 Remove the `action` kind, the Settings dialog button branch and `openSettings` from `top-nav.ts`, and drop the dialog from `app.ts`, and verify `top-nav.spec.ts` and `app.spec.ts` treat Settings as an `aria-disabled` placeholder and `ng build` passes

## 2. Table settings on the user list

- [ ] 2.1 Move the dialog to `src/app/users/table-settings-dialog.ts` as `TableSettingsDialog`, title it "Table settings" and remove the Theme group, and verify `table-settings-dialog.spec.ts` (renamed from `settings-dialog.spec.ts`) has no Theme cases and checks the heading
- [ ] 2.2 Put a Table settings button with `aria-haspopup="dialog"` across from the search field in `users-page.ts`, open the dialog from it and return focus to it on close, and verify `users-page.spec.ts` cases for opening, Close and Escape
- [ ] 2.3 Point `e2e/support/app.ts` `openSettingsDialog` at the list's Table settings button, remove dialog states on screens other than the list from `axe.e2e.ts`, `layout.e2e.ts` and `keyboard.e2e.ts`, and add a 1280 px check that the button shares the search row and a 320 px reflow check

## 3. Selected state in both themes

- [ ] 3.1 Screenshot the open dialog in light and dark at 1280 px with Compact selected and Striped rows off, and verify the dark screenshot shows the reported unchecked-radio problem before changing anything
- [ ] 3.2 Replace the native look with `appearance-none` token styling in separate `RADIO_CLASSES` and `CHECKBOX_CLASSES`, with `forced-colors:appearance-auto`, and verify new screenshots in both themes show empty outlines for unselected controls and filled marks for selected ones
- [ ] 3.3 Measure each unselected outline and selected fill against the dialog surface in both themes, and verify every pair is at least 3:1 and is recorded in `docs/accessibility.md`'s Theme colors table

## 4. Compact by default

- [ ] 4.1 Set `DEFAULTS.density` to `compact` in `table-settings.service.ts`, and verify `table-settings.service.spec.ts` covers the new default and a stored Comfortable being kept
- [ ] 4.2 Update `e2e/settings.e2e.ts` for a Compact default (the density test starts at 48 px and switches to Comfortable at 64 px), and verify it passes

## 5. Resizable columns

- [ ] 5.1 Add `resizableColumns` (default off) to `TableSettingsService`, a `resizableColumns` entry to `WCAG_FAILURES`, and the Resizable columns checkbox with its hint and note to the dialog, and drop "Column widths stay the same." from the Draggable columns hint, and verify `table-settings.service.spec.ts` and `table-settings-dialog.spec.ts` cover the default, storage and the note's `aria-describedby`
- [ ] 5.2 Bind column resizing to the setting in `users-grid.ts` with a `minWidth` on every column, and verify in `e2e/settings.e2e.ts` that dragging the Email header edge and Alt with Left Arrow on its focused header resize only when on and stop at its minimum, and that no cell text clips under text spacing at that width

## 6. Fixed header

- [ ] 6.1 Add `fixedHeader` (default off) to `TableSettingsService` and the Fixed header checkbox to the dialog, and verify the service and dialog specs cover the default and storage
- [ ] 6.2 Switch `domLayout` between `autoHeight` and `normal` with a bounded host height from the setting in `users-grid.ts`, and verify in `e2e/settings.e2e.ts` that with a 100-row page the header stays visible after scrolling to the last row when on, and scrolls away when off
- [ ] 6.3 Add Fixed header on to the axe and layout e2e states, and verify reflow at 320 px, 320 by 256 px, and focus not obscured while arrowing through a 100-row page

## 7. Docs and checks

- [ ] 7.1 Update `README.md`'s Settings paragraph, the `docs/accessibility.md` rows that name the Settings entry, the Theme group or 64 px rows, 2.5.7 for the second known gap, and 2.4.11 for the fixed header, and verify `npx prettier --check src e2e` is clean
- [ ] 7.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` with port 4600 free, and `openspec validate polish-settings-dialog --strict`, and verify all pass
- [ ] 7.3 After archive, rewrite the Purpose in `openspec/specs/settings-dialog/spec.md` for a table settings dialog opened from the user list, and verify `openspec validate --specs --strict` passes
