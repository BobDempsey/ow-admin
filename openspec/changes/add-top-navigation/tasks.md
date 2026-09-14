## 1. Routing and titles

- [x] 1.1 Add `UsersPage` in `src/app/users/users-page.ts` with a focusable `h1`, and verify `ng build` passes
- [x] 1.2 Define routes (`users` lazy with title `Users`, `''` and `**` redirecting to `users`) and verify router tests show `/` and an unknown path land on `/users`
- [x] 1.3 Add `PageTitleStrategy`, register it in `app.config.ts`, set `index.html` title to `Orbweaver Admin`, and verify a test shows `/users` sets `Users | Orbweaver Admin`

## 2. Top nav

- [x] 2.1 Build `TopNav` with the wordmark, the Users link and the Dashboard, Reports and Settings placeholders, styled per design.md, and verify `ng build` passes
- [x] 2.2 Write `TopNav` tests: a `nav` landmark with an accessible name, Users link `href` is `/users` and has `aria-current="page"` on `/users` while no other entry does, placeholders have `aria-disabled="true"` and an accessible name containing "not available yet", and clicking or pressing Enter on a placeholder leaves the URL unchanged without errors; verify they pass

## 3. App shell

- [x] 3.1 Replace the starter markup in `App` with the skip link, header, nav and `main#main`, delete `app.css`, and verify `ng build` passes
- [x] 3.2 Move focus to the screen `h1` after in-app navigation but not on initial load, and verify tests cover both cases
- [x] 3.3 Rewrite `app.spec.ts` so it checks the skip link targets `#main`, the header and main landmarks render, and the nav shows on `/users`; verify it passes

## 4. Accessibility checks

- [x] 4.1 Add `axe-core` as a dev dependency and `src/testing/axe.ts` with `expectNoAxeViolations`, and verify `npm ls axe-core` shows it installed
- [x] 4.2 Run axe against the rendered shell on `/users` and verify the test passes with no violations
- [x] 4.3 Check the running app at 320 px and 1280 px widths with keyboard only (skip link, Tab through entries, visible focus, no horizontal scroll) and record the result in the handoff

## 5. Verification

- [x] 5.1 Verify `ng build`, `ng test --watch=false` and `npx prettier --check src` all pass
