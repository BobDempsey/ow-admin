## 1. Setup and routing

- [x] 1.1 Install `ag-grid-angular@36.1.0` and verify `npm ls ag-grid-angular ag-grid-community` shows 36.1.0 for both
- [x] 1.2 Add `UserDetailPage` with `<h1 tabindex="-1">User</h1>` and the lazy `users/:id` route titled `User`, and verify a router test shows `/users/u-000001` renders it with title `User | Orbweaver Admin`

## 2. Data loading

- [x] 2.1 Add `UsersService.loadPage({ skip, limit })` over `UsersApi.list`, and verify a test against the in-memory API (latency 0) returns 25 items and a total of 500,000 for `{ skip: 0, limit: 25 }`
- [x] 2.2 Add `createUsersDatasource` in `users-datasource.ts`, and verify tests show `startRow` 50 and `endRow` 75 request `{ skip: 50, limit: 25 }`, success calls `successCallback(items, total)` and the `loaded` hook, and an `ApiError` calls `failCallback()` and the `failed` hook, with `loading` set true then false in both cases

## 3. Grid

- [x] 3.1 Build `UserNameCell` with a `routerLink` to `/users/{id}` and verify a test shows the link's text is the user name and its `href` is `/users/{id}`
- [x] 3.2 Build `UsersGrid` with the Infinite Row Model, pagination, page sizes 25, 50 and 100 (default 25), `cacheBlockSize` bound to page size, `maxBlocksInCache` 1, the four columns, `domLayout: 'autoHeight'`, `ensureDomOrder` and the theme from design.md, registering only the modules it needs, and verify `ng build` passes with AG Grid absent from the initial chunk
- [x] 3.3 Wire `rowClicked` (skipping clicks inside the name link) and `cellKeyDown` Enter to the `openUser` output, and the page size change to purge the cache and return to the first page, and verify with the running app that each page and each size change issues one `GET /users` with the expected `skip` and `limit` (switching to grid re-creation if a live `cacheBlockSize` change does not apply)

## 4. Users page

- [x] 4.1 Replace the `UsersPage` body with the total line, the `role="status"` loading region, the `role="alert"` error block with Try again, and `UsersGrid`, navigating on `openUser`, and verify `ng build` passes
- [x] 4.2 Write `UsersPage` tests with a stubbed grid: the total shows as `500,000 users` after `loaded`, the status region reads "Loading users…" only while loading, `failed` shows the alert and Try again, Try again clears the alert and refreshes the grid, and `openUser` navigates to `/users/{id}`; verify they pass
- [x] 4.3 Run `expectNoAxeViolations` against the rendered `UsersPage` in both the loaded and failed states and verify no violations

## 5. Browser check

- [x] 5.1 In the running app at 1280 px and 320 px, verify keyboard-only use: focus reaches the grid, arrow keys move between cells with a visible focus indicator, Enter on a row opens `/users/{id}`, the pagination panel's buttons and page size selector are reachable and named, and the page does not scroll sideways; run axe in the browser including color contrast, and record results and any AG Grid gaps in the handoff
- [x] 5.2 Force a failed page (for example by pointing the datasource at a missing endpoint temporarily), verify the alert and Try again recover, then revert the forcing change

## 6. Verification

- [x] 6.1 Verify `ng build`, `ng test --watch=false` and `npx prettier --check src` all pass and `openspec validate build-user-list --strict` passes
