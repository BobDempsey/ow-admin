## 1. Browser suite setup

- [x] 1.1 Install `@playwright/test@1.63.0` and `@axe-core/playwright@4.13.0` as exact dev dependencies, and verify `npm ls @playwright/test @axe-core/playwright axe-core` shows one `axe-core` 4.13.x
- [x] 1.2 Add `playwright.config.ts` (Chromium, `testDir: 'e2e'`, `*.e2e.ts`, `webServer` on port 4600, `baseURL`), `e2e/tsconfig.json` and the `test:a11y` script, install the matching Chromium if needed, and verify a smoke test that loads `/users` and finds the Users heading passes with `npm run test:a11y` while `ng test --watch=false` still runs only unit tests
- [x] 1.3 Add `e2e/axe.ts` with the WCAG A and AA tags and readable failures, plus helpers for reflow, focus-not-obscured tabbing, target-size measurement and text spacing injection, and verify each helper fails against a deliberately broken fixture page and passes on `/users/new`

## 2. Audit

- [x] 2.1 Write axe scans for every screen and state listed in design.md at 1280 and 320 px, run them, and record every violation found before fixing anything
- [x] 2.2 Write the keyboard flow tests for nav, list, create, edit and the conflict dialog, with focus-not-obscured checks on each screen, run them, and record failures
- [x] 2.3 Write the reflow, 200 percent zoom and text spacing checks for every screen and the open dialog, run them with screenshots, and record failures
- [x] 2.4 Check the grid in the browser for drag-only column moving and resizing, the grid role and `aria-rowcount`, and header names, and record what is found

## 3. Fixes

- [x] 3.1 Turn off column moving and resizing in `UsersGrid`, and verify an e2e test shows dragging a header neither moves nor resizes a column
- [x] 3.2 Set the detail screen's document title to the user's name or `User not found`, and verify unit tests for both titles and an e2e check of `document.title`
- [x] 3.3 Fix each remaining failure recorded in group 2, one commit-sized change at a time, and verify the matching e2e test and any new unit test pass; list anything not fixed as a known gap with its reason

## 4. Report

- [x] 4.1 Write `docs/accessibility.md` with scope, setup, and every WCAG 2.2 A and AA criterion with result and evidence, and verify by counting that every A and AA criterion in WCAG 2.2 appears exactly once
- [x] 4.2 Add the NVDA script with expected announcements to the report, give it to the user, and wait for their results
- [x] 4.3 Record the user's observed announcements in the report (steps 1 and 2 as expected, 3 to 21 not run, since the PDF does not require a screen reader pass), fix or list as known gaps any mismatches, and verify the report has no empty Observed rows

## 5. Verification

- [x] 5.1 Verify `npm run test:a11y`, `ng build`, `ng test --watch=false` and `npx prettier --check src e2e` all pass, `openspec validate verify-wcag-accessibility --strict` passes, and the README names the `test:a11y` command
