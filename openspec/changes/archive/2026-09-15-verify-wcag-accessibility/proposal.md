## Why

The PDF asks for consideration of WCAG 2.2, and each screen so far passed axe and a keyboard check as it was built. Nobody has yet checked the app as a whole against every WCAG 2.2 A and AA criterion, those checks live only in handoff notes a reviewer will not read, and nothing re-runs them when code changes. Several criteria have not been looked at at all: dragging movements (2.5.7) in AG Grid's column headers, text spacing (1.4.12), resize text (1.4.4), page titles on the detail screen (2.4.2), and screen reader output.

## What Changes

- Add a repeatable browser accessibility suite with `@playwright/test` and `@axe-core/playwright`, run by an npm script against the dev server. It runs axe with the WCAG 2.0, 2.1 and 2.2 A and AA rule tags, color contrast included, on every screen and state at 1280 px and 320 px, and replays the keyboard flows for navigation, the list, create, edit and the conflict dialog.
- Fix the gaps the audit is expected to find, each confirmed in the browser first: AG Grid's drag-only column moving and resizing, a detail screen title that does not name the user, and any failures the suite or the text spacing and resize checks turn up.
- Write `docs/accessibility.md`, a conformance report listing every WCAG 2.2 A and AA criterion as passes, not applicable, or known gap, with how each was checked.
- Write a scripted NVDA pass with expected announcements. The user runs what they choose, and the report marks every step as observed or not run. The PDF does not require a screen reader pass, so the conformance report requirement does not name one.
- Drop password reset from the keyboard operability scenario, since the reset UI is optional; the password reset task adds its own keyboard scenario if it is built.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `accessibility`: narrows the keyboard scenario to list, create, view and edit, and adds requirements for page titles, reflow and target size, text resize and spacing, dragging alternatives, focus not obscured, and a published conformance report.

## Impact

- New dev dependencies: `@playwright/test` 1.63.0 (Apache-2.0) and `@axe-core/playwright` 4.13.0 (MPL-2.0), which pins `axe-core` ~4.13.0 to match the existing dev dependency.
- New `playwright.config.ts`, an `e2e/` folder, and a `test:a11y` npm script. `ng test` is unchanged and does not run the browser suite.
- Likely code changes in `src/app/users/users-grid.ts` (column moving and resizing), `src/app/users/user-detail-page.ts` (document title), and `src/styles.css`, plus whatever else the audit finds.
- New `docs/accessibility.md`.
