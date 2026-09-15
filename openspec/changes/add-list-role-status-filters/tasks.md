## 1. API

- [ ] 1.1 Add `role` and `status` to `validateListQuery`, rejecting values outside `USER_ROLES` and `USER_STATUSES` (case included) and treating empty as absent, and verify `user-validation.spec.ts` cases for each valid value, an unknown role, `status=Active` and empty values
- [ ] 1.2 Replace `UserStore.search` with a filtered scan over `{ q, role, status }`, cached under writes, sort, `q`, role and status, and verify `user-store.spec.ts` cases for role only, role and status, filter with search and sort across two pages, and a created then updated user moving between status filters
- [ ] 1.3 Pass `role` and `status` from the interceptor to the store, and verify `in-memory-api.interceptor.spec.ts` cases for a filtered `200` with the right `total` and `400`s naming `role` and `status`
- [ ] 1.4 Add `role` and `status` to `PageRequest` and `UsersApi.list`, and verify `users-api.spec.ts` checks the sent parameters and that absent values send nothing
- [ ] 1.5 Measure a role filter and a role plus search scan over 500,000 users in Vitest, and verify each stays within the handoff's 423 ms full-scan figure plus 20 percent, recording the numbers in the change's design.md

## 2. List query

- [ ] 2.1 Introduce `ListQuery`, make `createUsersDatasource` copy `q`, `role` and `status` into the request, and verify `users-datasource.spec.ts` cases for each field alone and together
- [ ] 2.2 Change `UsersGrid.query` to a `ListQuery` input compared field by field, and set the no-rows text to "No users match your search or filters.", and verify `ng build` passes and an equal new object does not purge the cache in a unit test

## 3. Filter controls

- [ ] 3.1 Add labeled Role and Status selects after Search users in `users-page.ts`, each starting on its "Any" option, building the grid's `ListQuery` from the debounced search and both filters, and verify `users-page.spec.ts` cases for labels, immediate apply, clearing with "Any", and combining with a search
- [ ] 3.2 Word the total and the announcement as matches while any filter is active, announce after a filter change loads, and verify `users-page.spec.ts` cases for a filter-only match count, focus staying on the select, and the total returning to "N users" after the last filter is cleared

## 4. Browser checks

- [ ] 4.1 Add `e2e/filter.e2e.ts` covering status filter requests and rows, filter plus search, filter keeping the sort, clearing, and no results, using `recordListRequests`, and verify it passes
- [ ] 4.2 Add a filtered list state to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` in both themes at 1280 and 320 px, update tabbing order in `e2e/keyboard.e2e.ts` and any "your search." assertions, and verify `npm run test:a11y` passes with port 4600 free

## 5. Docs and checks

- [ ] 5.1 Add `role` and `status` to `README.md`'s endpoint table marked as beyond the PDF contract, and update `docs/accessibility.md` rows 1.3.1, 3.3.2 and 4.1.3 for the dropdowns and their announcement, and verify `npx prettier --check src e2e` is clean
- [ ] 5.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` and `openspec validate add-list-role-status-filters --strict`, and verify all pass
