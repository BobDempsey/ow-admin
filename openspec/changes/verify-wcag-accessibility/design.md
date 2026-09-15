## Context

Four screens and one dialog exist: the top nav shell, `/users` (AG Grid Community 36.1, Infinite Row Model with pagination), `/users/new`, `/users/:id`, and the conflict dialog. Unit tests already run axe-core 4.13 in jsdom with `color-contrast` disabled (`src/testing/axe.ts`). Browser checks so far were one-off Playwright MCP runs recorded in `handoff.md`. `ng test` uses `@angular/build:unit-test` with Vitest over `src/**/*.spec.ts`. Chromium builds are already cached under `%LOCALAPPDATA%\ms-playwright`. See proposal.md for motivation and specs/accessibility/spec.md for the requirements.

Library facts were checked on 2026-09-14: `@playwright/test` is 1.63.0 on npm (Node 20 or later); `@axe-core/playwright` is 4.13.0 and depends on `axe-core ~4.13.0`. Playwright's accessibility testing guide (playwright.dev/docs/accessibility-testing) documents `new AxeBuilder({ page }).withTags([...]).analyze()` and says automated scans find only some problems, so manual checks are still needed. Its web server guide (playwright.dev/docs/test-webserver) documents `webServer.command`, `url`, `reuseExistingServer` and `timeout`. W3C's "What's new in WCAG 2.2" (w3.org/WAI/standards-guidelines/wcag/new-in-22/) lists six new A and AA criteria (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) and the removal of 4.1.1 Parsing.

## Goals / Non-Goals

**Goals:**
- One command that fails when any screen or state regresses on axe's WCAG A and AA rules or on the keyboard flows.
- A criterion-by-criterion report a reviewer can check against the running app.
- Fix what the audit finds in this change, not in a later one.

**Non-Goals:**
- AAA criteria, including 2.4.13 Focus Appearance, though the existing 2 px solid rings are recorded.
- Browsers other than Chromium in the automated suite. Firefox and Safari are noted as unchecked in the report.
- Forced colors or Windows high contrast mode, which WCAG AA does not require; recorded as unchecked.
- Running the suite in CI; the repo has no CI.
- Password reset, which stays an optional task.

## Decisions

### Browser suite beside the unit tests

- `playwright.config.ts` at the repo root, `testDir: 'e2e'`, files named `*.e2e.ts` so Vitest's `*.spec.ts` glob never picks them up, and a separate `e2e/tsconfig.json` so `tsconfig.app.json` and `tsconfig.spec.json` stay untouched.
- `webServer` runs `npx ng serve --port 4600` with `reuseExistingServer: false` and a 120 s timeout. Port 4600 avoids 4200 to 4500, which other `ng serve` processes of this app have held. `baseURL` is `http://localhost:4600`.
- One Chromium project with two viewport sizes expressed as test parameters (1280 by 900 and 320 by 800), so every screen runs at both.
- `npm run test:a11y` runs `playwright test`. If the cached Chromium build does not match 1.63.0, `npx playwright install chromium` is the setup step, recorded in the README.
- Alternative: drive the suite through Vitest browser mode. It would share the unit test runner, but it renders components rather than routed pages with the real AG Grid, and the checks that matter here (reflow, zoom, focus visibility, grid behavior) need the whole app.

### axe scope

`e2e/axe.ts` wraps `AxeBuilder` with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, and fails with a list of rule ids and selectors. Nothing is excluded or disabled by default; any exclusion must be named in the report as a known gap. States scanned: list loaded, list load failure, new user empty and with errors, detail loaded, not found, load failure, save failure, conflict dialog open. The API is in-memory, so `page.route` has no network request to intercept. Tests reach error states the way the earlier browser checks did: an unknown id for not found, and the Simulate control for the conflict. Load and save failures that need a 500 are forced by calling into the app from `page.evaluate` through `ng.getComponent`, which works in the dev server only, and each such test says so in its name.

### Keyboard, focus and reflow checks

- Keyboard flows press real keys and assert `document.activeElement` at each step: skip link, nav, grid as one tab stop, Enter on a row, New user, create with an empty submit then a valid one, edit and save, simulate then Save, Escape, Reload and Overwrite in the dialog.
- Focus not obscured (2.4.11): a helper tabs through every focusable element on a screen and asserts each focused element's bounding box intersects the viewport.
- Reflow (1.4.10): assert `scrollWidth <= clientWidth` on `documentElement` at 320 px for each screen and with the dialog open.
- Target size (2.5.8): axe's `target-size` rule under the `wcag22aa` tag, plus a helper that measures every visible link, button, input and select and reports any under 24 by 24 px for manual review of the spacing exception.
- Text spacing (1.4.12): inject the WCAG 1.4.12 values as a stylesheet with `!important`, then assert no element with text has `scrollHeight > clientHeight` or `scrollWidth > clientWidth` where overflow is hidden, and take a screenshot per screen for the report.
- Resize text (1.4.4): run the reflow and clipping assertions with the page zoomed to 200 percent through CSS `zoom: 2` on `html` at 1280 px. Chromium applies layout the same way as browser zoom for this purpose; the report notes it is an approximation of the browser's own zoom.

### Expected fixes

- AG Grid columns can be moved and resized by dragging their headers by default. The user list does not need either, so `defaultColDef` gets `resizable: false` and the grid gets `suppressMovableColumns: true`. Alternative: keep them and add keyboard alternatives, which AG Grid Community does not offer for moving and would mean building a column menu.
- The detail screen's title stays `User` from the route. `UserDetailPage` sets the document title through `Title` and `APP_NAME` when the load settles: the user's name, or `User not found`. The route title stays `User` for the moment before the load.
- Anything else the suite finds is fixed in the smallest component that owns it, with a unit test where jsdom can express it. `audit-findings.md` in this change records what the audit found on 2026-09-15.
- Grid cells truncated names and emails with an ellipsis under text spacing and 200 percent zoom. AG Grid does not allow variable row height with the Infinite Row Model, so rows cannot grow to fit. The user chose on 2026-09-15 to make every row a fixed 64 px and let cell text wrap onto a second line, breaking anywhere inside long emails, over raising column minimum widths (still truncates long values) or accepting it as a known gap.
- AG Grid moves focus from the header to its Page Size combobox without scrolling it into view. `UsersGrid` listens for `focusin` on its host and calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })` on the target, which does nothing when the element is already visible.

### Enter on a grid row

The list's handoff note flagged that Enter on a focused grid cell navigates, which a screen reader user may not expect from a grid. The decision is to keep it: the name cell is also a named link, arrow keys still move between cells, and the grid is one tab stop. The NVDA script covers what NVDA announces on the focused row, but that step was not run, so the report marks it unverified.

### Screen reader pass

`docs/accessibility.md` ends with an NVDA script: numbered steps with the keys to press and the announcement expected at each (heading level and name on navigation, the status and alert messages, field labels and errors, the dialog name and description). The user runs it with NVDA and the current Chrome, and reports what they heard. Their results replace the "expected" column with "observed" and any mismatch becomes a fix or a known gap. This is the one task that waits on the user.

Revised 2026-09-15: the user ran steps 1 and 2, both as expected, and chose not to run steps 3 to 21. The report marks those steps "Not run". The PDF asks only for consideration of WCAG 2.2 and never mentions a screen reader, so the conformance report requirement no longer names a screen reader pass.

### Report format

`docs/accessibility.md`, written for a reviewer of the take-home: scope and test setup, then one table per WCAG principle with columns for criterion, level, result, and evidence. Evidence names the e2e test, unit test, manual check or reason for not applicable. Known gaps get their own section with the affected screen. Criteria that cannot apply (captions, audio, authentication, consistent help) say why in a few words.

## Risks / Trade-offs

- [The dev server takes long to start on a cold cache, and `ng serve` output may confuse `webServer` readiness] → `webServer.url` points at `/users` and waits up to 120 s; reuse is off so a stray server on another port is never tested by mistake.
- [Forcing 500s through `ng.getComponent` couples tests to component internals] → Only two tests use it, both named for it; if it breaks they are replaced by an API latency or failure token set from a query parameter in dev mode, which would need its own spec change.
- [CSS `zoom` is not identical to browser zoom] → Recorded as an approximation; the report also lists a manual Ctrl-plus check at 200 percent.
- [axe in Chromium can pass while NVDA announces something unhelpful] → Left open: only two steps of the NVDA pass ran, and the report says so under "Known gaps".
- [Turning off column resizing stops admins widening the email column] → Columns already flex to fill the width, and the grid scrolls sideways inside its own box below its minimum width.
- [The user may not have NVDA installed] → The script also works with Narrator; the report records which reader was used.
