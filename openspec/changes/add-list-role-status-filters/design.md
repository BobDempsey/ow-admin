## Context

Search already runs end to end: `validateListQuery` parses `sort` and `q`, the interceptor passes them to `UserStore.list(skip, limit, sort, q)`, and `UsersApi.list` sends them. In the store, a search walks every user in the requested order through `ordered(sort)`, keeps the matching indices, and caches them under a key of the write counter, the sort and `q`. The handoff records a full scan at 316 to 423 ms in Vitest on Node's V8.

On the page, `UsersPage` holds `searchText`, a debounced `query`, and `loadedQuery` for the total's wording; `UsersGrid` takes `query` as a string input, purges its cache and goes to page one when it changes, and `createUsersDatasource` reads it for `q`. Seeded roles and statuses come from index arithmetic in `user-seed.ts`.

## Goals / Non-Goals

**Goals:**
- One scan path for search and filters, so a filtered page costs what a search costs today.
- One list query value flowing from page to grid to datasource, so a new filter does not add a new input at each layer.

**Non-Goals:**
- Choosing more than one role or status at once.
- AG Grid column filters or a filter panel.
- Remembering filters across reloads or in the URL.
- Computing seeded matches from index arithmetic instead of scanning.

## Decisions

**Exact, case-sensitive values that match the model.** `role` and `status` take the literal values in `USER_ROLES` and `USER_STATUSES`, the same values `POST` and `PUT` accept, so the API has one spelling for each. An empty value means no filter, which lets a client send the parameter unconditionally. Alternative: ignore case, rejected because create and update already reject `admin`, and the list should not accept a spelling the writes refuse.

**Generalize `search` into a filtered scan.** `UserStore.list` takes `(skip, limit, sort?, filter?)` where `filter` is `{ q?, role?, status? }`. When any field is set, the store scans `ordered(sort)` once, testing role and status before the lower-cased text match since those are cheap equality checks, and caches under a key of writes, sort, `q`, role and status. Without a filter the current O(limit) paths stay as they are. `validateListQuery` grows `role` and `status` arguments and returns them in its value. Alternative: precompute per-role and per-status index lists for the seed, rejected for now because the scan already fits the measured budget and written users would need merging into each list; the Non-Goals keep it open.

**A `ListQuery` object instead of a `query` string.** `PageRequest` gains `role?` and `status?`. `UsersGrid.query` becomes `input<ListQuery>({ q: '' })` with `ListQuery = { q: string; role?: UserRole; status?: UserStatus }`, compared field by field in the effect so a new object with the same values does not restart paging. The datasource copies the fields it finds into the request. `UsersPage` builds the query with a `computed` from the debounced search text and two filter signals, so a dropdown change takes effect at once while typing keeps its 300 ms debounce. Alternative: separate `role` and `status` inputs on the grid, rejected because each would need its own purge effect and the three can change in the same tick when a later "clear all" control lands.

**Native `<select>` elements with visible labels.** Each is a `<label>` plus `<select>` in the search row, styled like the search field (`min-h-11`, `border-line-input`, `bg-surface`), with values bound through plain signals like the search field rather than Signal Forms, since nothing is submitted. The "Any" option has the empty value. The row order is Search users, Role, Status, then the Table settings button at the far end, wrapping at narrow widths. Alternative: a custom listbox, rejected because a native select brings keyboard, screen reader and mobile behavior with no code.

**Match wording follows any active filter.** `loadedQuery` becomes the loaded `ListQuery`, and the page's "is this a match count" check becomes "has `q`, `role` or `status`". The announcement flag set on a search change is set on a filter change too. The no-rows template reads "No users match your search or filters."

## Risks / Trade-offs

- [A filter change on the unfiltered, unsorted list now scans 500,000 users] → the same cost a search pays, measured at up to 423 ms; the cache makes paging within a filter O(limit).
- [Three changes edit `users-page.ts`] → apply after `fix-search-match-count` and `polish-settings-dialog`, and build on their count wording and search row.
- [At 320 px the search row now holds four controls] → they wrap to their own rows; the layout e2e checks reflow and target size with a filter chosen.
- [e2e assertions that read "your search." break] → update them in the same task as the no-rows template.
