## 1. Route and nav entry

- [x] 1.1 Add the `about` route with title `About` before `**`, and a first `about-page.ts` with `<h1 tabindex="-1">`, and verify a new `app.routes.spec.ts` test shows the heading on `/about` with title `About | Orbweaver Admin`
- [x] 1.2 Add `{ label: 'About', path: '/about' }` after Settings in `NAV_ENTRIES`, and verify `top-nav.spec.ts` tests that About links to `/about`, that only About has `aria-current` on `/about`, and that the three placeholders are unchanged

## 2. About content

- [x] 2.1 Write the five sections (what the app does, how the data works, try an edit conflict, accessibility, development with OpenSpec and the AI tools) at landing-page length with `routerLink`s to `/users` and `/users/new`, and verify `about-page.spec.ts` checks the five `h2`s, the link hrefs, the tooling names and `expectNoAxeViolations`
- [x] 2.2 Check the copy against the spec's length limit and the prose rules, and verify a search of `about-page.ts` finds no em dashes and none of the banned words

## 3. Browser suite

- [x] 3.1 Add `openAbout` to `e2e/support/app.ts` and the About screen to `e2e/axe.e2e.ts`, `e2e/layout.e2e.ts` and `e2e/titles.e2e.ts`, and verify those tests pass at 1280 and 320 px
- [x] 3.2 Add a keyboard test that Tabs from Settings to About, presses Enter, and finds `/about` with focus on the About heading, and verify it passes

## 4. Report and verification

- [x] 4.1 Add the About screen to `docs/accessibility.md` (scope, 2.4.2 titles, 2.4.4 links, state count), and verify every changed row names its evidence
- [x] 4.2 Verify `ng test --watch=false`, `ng build`, `npm run test:a11y`, `npx prettier --check src e2e` and `openspec validate add-about-page --strict` all pass, and check in the browser at 1280 and 320 px that About sits after Settings, wraps without sideways scroll, and takes `aria-current` from Users
