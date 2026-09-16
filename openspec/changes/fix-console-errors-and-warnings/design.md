## Context

See proposal.md for the findings. The one message is Angular's `NG0953`, which `OutputEmitterRef.emit` logs with `console.warn` in dev mode when the owning component is already destroyed. Production builds drop the message, so `ng build` output never shows it.

`UsersGrid` builds its datasource once, with callbacks that call `this.loadingChange.emit`, `this.loaded.emit` and `this.failed.emit`. `createUsersDatasource.getRows` awaits `UsersService.loadPage`, which answers after the in-memory API's 250 ms latency (`API_LATENCY_MS`), plus AG Grid's 50 ms `blockLoadDebounceMillis`. When the router leaves `/users` inside that window, `UsersPage` and `UsersGrid` are destroyed, but the promise still settles and the datasource runs `events.loaded(total)` and then `events.loading(false)` in its `finally`. Each emit hits a destroyed `OutputRef`, which gives the two warnings per occurrence. A failed load would warn for `failed` and `loading` the same way. `params.successCallback` on the destroyed AG Grid logs nothing.

`UserDetailPage` and `NewUserPage` also await requests, but they write signals and never emit outputs from async work, and writing a signal on a destroyed component does not warn. The walk confirmed they log nothing.

The browser suite has 11 `e2e/*.e2e.ts` files, all importing `test` from `@playwright/test`, and shared helpers in `e2e/support/`. No test listens to `console` or `pageerror` today.

## Goals / Non-Goals

**Goals:**
- No `NG0953` when leaving the list mid-load, by any route out.
- A guard in the browser suite that turns any future console error, console warning or uncaught error into a failing test, in every existing and future e2e test.

**Non-Goals:**
- Cancelling the in-flight request when the list is destroyed. The in-memory API does no real work to save, and AG Grid's datasource has no abort hook.
- A console check in the Vitest unit suite. It reported nothing, and jsdom noise would need its own allowlist.
- Watching `console.log`, `info` or `debug` output.
- Changes to the other screens, which logged nothing.

## Decisions

**Fix NG0953 in `UsersGrid`, not in the datasource.** `UsersGrid` injects `DestroyRef` and wraps each datasource event so it returns early when `destroyRef.destroyed` is true: `loading: (inFlight) => { if (!destroyRef.destroyed) this.loadingChange.emit(inFlight); }`, and the same for `loaded` and `failed`. A small local helper keeps the three callbacks to one line each. `createUsersDatasource` stays unaware of Angular, and its spec needs no change. Alternative: an `isActive()` argument to `createUsersDatasource`, rejected because it adds a parameter to a plain function for a concern only the component has. Alternative: `outputToObservable` or `takeUntilDestroyed`, rejected because the events are plain callbacks, not streams. Alternative: raise `API_LATENCY_MS` to zero in dev, rejected because it hides the bug and removes the loading state the specs describe.

**A `test` fixture that fails on console output.** A new `e2e/support/test.ts` exports `test = base.extend(...)` and re-exports `expect`. An auto fixture (`{ auto: true }`) attaches `page.on('console')` for `error` and `warning` and `page.on('pageerror')` before each test, runs the test, then fails with every recorded message, its type and its source URL. Each `e2e/*.e2e.ts` file imports `test` and `expect` from `./support/test`. Helpers in `e2e/support/*.ts` keep importing types such as `Page` from `@playwright/test`. Alternative: a `globalSetup` or a custom reporter, rejected because neither sees the page. Alternative: a `test.afterEach` in each file, rejected because a new file could forget it.

**An allowlist, empty today.** The fixture takes an `allowConsole` option (an array of regular expressions, default empty) that a test can set with `test.use` if a message is expected and outside our control. Nothing uses it now; the walk found nothing to allow. Chromium's own messages, such as a failed favicon request, show up as `console` errors too, so the option exists for that case without weakening the guard for everyone.

**The fixture checks after the test body, not inside it.** Messages logged after the last assertion still count, since the fixture's teardown runs after the body. The fixture waits for no extra time, though, so a warning that fires after teardown goes unseen. The leave-mid-load check covers that gap for the one case we know about by waiting for the request to settle.

**A dedicated leave-mid-load check.** A new `e2e/console.e2e.ts` holds two tests from the spec: change the Status filter and click the About nav entry at once, and press Enter on the focused New user link right after `page.goto('/users')`. Each waits 500 ms after the next screen shows, which is longer than the 300 ms load window, so the settled request has had its chance to warn. The keyboard test can pass by luck today, since the key sometimes lands after the first load; the filter test fails reliably before the fix. Both run at 1280 px in the light theme only, since the bug has nothing to do with theme or width.

**A unit test for the guard.** `users-grid.spec.ts` gets a case that starts a `getRows` call with a slow `loadPage`, destroys the fixture, lets the promise settle, and checks that no output emitted and `console.warn` was not called.

## Risks / Trade-offs

- [The fixture fails tests on messages we cannot fix, such as a browser or AG Grid warning in some state the walk missed] → the `allowConsole` option handles it per test with a pattern and a comment; the first full `npm run test:a11y` run shows whether any exist.
- [AG Grid's `ValidationModule` is registered in dev and warns on bad grid options] → that is the point: such a warning now fails the suite instead of passing unseen.
- [Moving 11 files to a new import touches every e2e file] → the change is one import line per file, and `npx prettier --check src e2e` plus a full run confirm it.
- [The keyboard leave test is timing dependent and can pass before the fix] → accepted; the filter test fails reliably, and the unit test covers the guard without timing.
- [A 500 ms wait in two tests adds about a second to the suite] → accepted.
