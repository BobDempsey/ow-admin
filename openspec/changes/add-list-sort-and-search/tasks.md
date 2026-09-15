## 1. Measure

- [x] 1.1 In a throwaway browser test on the dev server, time building a sorted index of all 500,000 seeds by email and by name, and a full name-or-email scan for "a" and for "lamport", and verify each is under about one second; record the numbers and any fallback chosen in design.md

## 2. API layer

- [x] 2.1 Add `validateListQuery` for `sort` and `q` beside `validatePage`, and verify `user-validation.spec.ts` covers every field and direction, an unknown field, a bad direction, a missing colon, a blank `q`, and a 101-character `q`
- [x] 2.2 Add cached per-field seed sort orders, the written-user merge, and the cached search list to `UserStore.list(skip, limit, sort?, q?)`, and verify `user-store.spec.ts` covers ascending and descending order with id tie-breaks, page boundaries without gaps or repeats, an edited user moving in the order, a created user found by search, a search with sort and skip, no matches, and the cache rebuilding after a write
- [x] 2.3 Pass `sort` and `q` from the interceptor to the store with 400 responses for invalid values, and verify `in-memory-api.interceptor.spec.ts` covers a sorted page, a searched page with its `total`, both combined, and each 400
- [x] 2.4 Add `sort` and `q` to `PageRequest` and `UsersApi.list`, and verify `users-api.spec.ts` checks the query string, including a `q` with `@`, `+` and a space

## 3. Grid and page

- [x] 3.1 Make columns sortable one at a time with the asc, desc, none cycle, and map `sortModel` and the current query in `users-datasource.ts`, and verify `users-datasource.spec.ts` covers an unsorted request, each direction, and a query
- [x] 3.2 Add the `query` input to `UsersGrid` that purges the cache and returns to page one, and the no-rows overlay text, and verify in the browser that a query change requests `skip=0` with the query
- [x] 3.3 Add the Search users label, the `type="search"` input with placeholder "Name or email", the 300 ms debounce, the "N users match" total, and the match status message to `UsersPage`, and verify `users-page.spec.ts` (with the grid stubbed) covers the label, placeholder, debounce, trimmed queries, the match wording, "No users match", clearing, and `expectNoAxeViolations`

## 4. Browser suite

- [x] 4.1 Add grid e2e tests for sorting by clicking a header (the request and the first rows), reversing and clearing, `aria-sort` on headers, and paging keeping the sort, and verify they pass
- [x] 4.2 Add e2e tests for typing a search (one request, `skip=0`, rows that match), clearing it, no results with the overlay and status message, search keeping the sort, and a created user found by search, and verify they pass
- [x] 4.3 Add keyboard tests for Tab reaching Search users before the grid and Enter on a focused header sorting without opening a user, and add a searched list and a no-results list to the axe and layout states, and verify `npm run test:a11y` passes in full

## 5. Docs and checks

- [x] 5.1 Update `docs/accessibility.md` (scope, 1.3.1 search label, 2.1.1 sorting by keyboard, 3.3.2 label and placeholder, 4.1.2 `aria-sort`, 4.1.3 match announcements, state count) and `README.md` (the `sort` and `q` rows in the API table, marked as additions to the PDF contract, and a line on sorting and search), and verify every changed row names its evidence and neither file has an em dash
- [x] 5.2 Verify `ng test --watch=false`, `ng build`, `npm run test:a11y`, `npx prettier --check src e2e` and `openspec validate add-list-sort-and-search --strict` all pass, and check in the browser at 1280 and 320 px in both themes that sorting and search work and the first sorted request and a search feel responsive
