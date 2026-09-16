## 1. Console guard in the browser suite

- [x] 1.1 Add `e2e/support/test.ts` with the auto fixture from design.md (records `console` errors and warnings and `pageerror` events, fails the test with each message, its type and its source URL, and takes an `allowConsole` option that defaults to empty), and verify a throwaway test that calls `console.warn` in the page fails with that message and one that logs nothing passes, then delete the throwaway test
- [x] 1.2 Switch the `test` and `expect` imports in every `e2e/*.e2e.ts` file to `./support/test`, and verify `grep "from '@playwright/test'" e2e/*.e2e.ts` finds only type imports

## 2. Fix NG0953 on leaving the list mid-load

- [x] 2.1 Add `e2e/console.e2e.ts` with the two leave-mid-load tests from design.md, and verify the filter test fails with `NG0953` before the fix
- [x] 2.2 Guard the `loading`, `loaded` and `failed` callbacks in `UsersGrid` with `DestroyRef.destroyed`, add the `users-grid.spec.ts` case from design.md, and verify it fails without the guard and passes with it, and that both tests in `e2e/console.e2e.ts` pass

## 3. Docs and checks

- [x] 3.1 Add one sentence to the "Browser suite" paragraph of `docs/accessibility.md` saying every browser test fails on a console error, console warning or uncaught error, and verify `npx prettier --check src e2e` is clean
- [x] 3.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` with port 4600 free, `npx prettier --check src e2e` and `openspec validate fix-console-errors-and-warnings --strict`, and verify all pass with no test using `allowConsole`
