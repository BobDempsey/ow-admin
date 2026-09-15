## 1. Wording

- [x] 1.1 Add a pure `countLabel(total, query)` to `users-page.ts` that returns "1 user", "1 user matches", "N users" and "N users match" with thousands separators, and verify with unit cases for 0, 1, 2 and 500,000, with and without a query
- [x] 1.2 Use `countLabel` for the total beside the heading and for the status announcement, drop `DecimalPipe` if unused, and verify `ng build` passes

## 2. One visible count

- [x] 2.1 Wrap the status line's result text in `<span class="sr-only">` while "Loading users…" stays plain text and the `<p role="status">` keeps `min-h-6`, and verify a unit test finds the result inside an `.sr-only` span and "Loading users…" outside one

## 3. Quiet density reload

- [x] 3.1 Give `createUsersDatasource` a way to mark the next load quiet so it skips `loading(true/false)` but still emits `loaded` and `failed`, and verify with `users-datasource.spec.ts` cases for a quiet load, a quiet failure, and a normal load after a quiet one
- [x] 3.2 Mark the load quiet in `UsersGrid`'s density effect right before `refreshInfiniteCache()`, and verify in `e2e/settings.e2e.ts` that selecting Compact never shows "Loading users…" in the list status while rows reach 48 px and the page label stays the same
- [x] 3.3 In `e2e/settings.e2e.ts`, change density right after Next Page and verify "Loading users…" still appears for the page load

## 4. Tests and docs

- [x] 4.1 Update `users-page.spec.ts` for the singular wording (a search with `total` 1 shows and announces "1 user matches") and verify `ng test --watch=false` passes
- [x] 4.2 In `e2e/search.e2e.ts`, change "1 users match" to "1 user matches" and add a check that the announcement's computed `clipPath` is `inset(50%)`, and verify `npm run test:a11y` passes with port 4600 free
- [x] 4.3 Update the 4.1.3 row in `docs/accessibility.md` to say the search announcement is visually hidden because the heading total shows the count, and verify `npx prettier --check src e2e` is clean and `openspec validate fix-search-match-count --strict` passes
