## Why

The user asked us to run the app, surface any console errors or warnings, and fix them. A walk through every screen on the dev server on 2026-09-16 found one warning, the `NG0953` warning the handoff recorded once on 2026-09-14, and it reproduces reliably. Nothing in the browser suite fails on console output today, so a new warning can land without anyone noticing.

## What we found

We drove the dev server (port 4700) with Playwright in the light and dark color schemes at 1280 and 320 px, and recorded every `console` message of type `error` or `warning` plus every `pageerror`. The walk covered:

- `/users`: paging (Next, Last, First), page size 50, sorting each column both ways, search with matches and with none, every Role and Status option, and Table settings with each checkbox toggled on and off, both densities, Close and Escape.
- `/users/new`: an empty submit and a successful create.
- `/users/u-000042`: Save, Cancel, the simulate-edit demo with Keep editing, Reload, Overwrite and Escape in the conflict dialog, and the password reset with Cancel, Escape and Send reset email.
- `/users/u-999999`, `/about`, every Theme menu choice, the nav drawer at 320 px, and keyboard navigation from `/users` to `/users/new` and back (ten round trips).

A third script forced the list load, detail load, save and password reset to fail through `ng.getComponent`, as the browser suite does, and pressed each Try again; that logged nothing either. The first walk logged nothing, because each step waited for the list's rows before leaving. A second script left `/users` while a page request was still in flight, and that logged the warning.

**1. `NG0953: Unexpected emit for destroyed OutputRef. The owning directive/component is destroyed.`** (console warning, dev builds only, logged twice per occurrence)

- Where: leaving `/users` while the grid is loading a page. The two warnings come from the grid's `loaded` and `loading` outputs after the list screen is gone.
- Reproduce: open `/users` and wait for the rows. Pick "suspended" in the Status filter, then at once click About or New user (or press Enter on a focused New user link). Two warnings appear. It reproduced in 3 of 3 tries this way, and once in 3 tries when going Back to users and then pressing the browser's Back button within 60 ms. By keyboard, as in the 2026-09-14 run: open `/users`, focus New user and press Enter before the first page answers. That logged the two warnings in 1 of 5 tries, since the keypress has to land inside the first load's window. Leaving after the page has answered logs nothing, which is why the 2026-09-14 run saw it only once.
- Any trigger that starts a page load works (a filter, a search, a sort, a page change or the first load), as long as the admin leaves within the in-memory API's 250 ms latency.

**Build and unit tests.** `npx ng build` printed no warnings (no budget or template warnings). `npx ng test --watch=false` passed 315 tests in 27 files and printed no warnings, no errors, and no uncaught errors from Vitest.

## What Changes

- The user grid stops reporting load results after the list screen is destroyed, so leaving mid-load logs nothing.
- The browser suite fails any test whose page logs a console error or warning, or throws an uncaught error, so a new message fails `npm run test:a11y` with the message in the report.
- The browser suite gains a check that leaves the list while a page is loading, which fails today on the warning above.

## Capabilities

### New Capabilities

- `runtime-quality`: the app runs without console errors, console warnings or uncaught errors on every screen and flow.

### Modified Capabilities

None.

## Impact

- `src/app/users/users-grid.ts`: guard the datasource callbacks against a destroyed component, with a case in `users-grid.spec.ts`.
- A new `e2e/support/test.ts` exporting a `test` that records console messages and page errors and fails the test on any; every `e2e/*.e2e.ts` file imports `test` from it instead of from `@playwright/test`.
- A new `e2e/console.e2e.ts` for the leave-mid-load check.
- `docs/accessibility.md` mentions the console guard in its "Browser suite" paragraph.
- No API, dependency or behavior change beyond the missing warning.
