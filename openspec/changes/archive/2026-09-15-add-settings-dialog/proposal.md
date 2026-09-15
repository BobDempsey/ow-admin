## Why

The optional tasks list three display settings (theme, striped table rows, table density with draggable columns), and the Settings nav entry is a placeholder that does nothing. One settings dialog gives those options a home. One option, column dragging, cannot meet WCAG 2.2, so the dialog must tell the admin when a choice breaks a criterion rather than hide the trade-off.

## What Changes

- The Settings nav entry becomes a working button that opens a modal Settings dialog. Dashboard and Reports stay placeholders.
- The dialog offers the theme (Light, Dark, System, the same choice as the header control, which stays), striped table rows, table density (Comfortable, today's row height, or Compact), and draggable columns.
- Every change applies at once and is remembered in the browser. The dialog has one Close button, and Escape closes it.
- Any setting whose chosen value fails a WCAG 2.2 criterion shows a note beside it naming the criterion. Today that is only draggable columns (2.5.7 Dragging Movements), which is off by default.
- The accessibility spec's "No drag-only interactions" requirement allows opt-in column dragging, and the conformance report records it as a known gap that applies only while the setting is on.

## Capabilities

### New Capabilities

- `settings-dialog`: opening and closing the dialog, its focus handling, the theme and table settings, applying and remembering them, and the WCAG notes on non-conforming choices.

### Modified Capabilities

- `admin-navigation`: "Placeholder nav entries" exempts Settings, which now opens the dialog.
- `accessibility`: "No drag-only interactions" allows column dragging only when the admin turns it on in settings, with a WCAG note.

## Impact

- New settings dialog component and a table settings service with unit tests; `App` renders the dialog; `top-nav.ts` turns Settings into a button that asks `App` to open it.
- `users-grid.ts` reads the table settings for striped rows, row height and column moving; `src/styles.css` gains a stripe token with a dark value.
- `e2e/`: the axe and layout states add the open dialog, `grid.e2e.ts` keeps its 2.5.7 checks for the default and adds opt-in cases, and keyboard tests cover opening and closing the dialog.
- `docs/accessibility.md` covers the dialog and records the 2.5.7 known gap; the README mentions settings.
- Depends on `add-theme-switcher` (committed, not archived), whose theme service the dialog reuses. Archive that change first so its specs are in `openspec/specs/`.
- No new dependencies and no API changes.
