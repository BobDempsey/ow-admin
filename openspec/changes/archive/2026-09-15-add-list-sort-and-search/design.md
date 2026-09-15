## Context

`UserStore` holds no seed data: `seedUser(index)` builds a user from its index (name from `index % 23` and `index % 29`, email with the index in it, role from `index % 20` and `% 5`, status from `index % 11` and `% 7`), and only created or updated users live in a `written` map. `list(skip, limit)` reads `limit` indices, so a page costs O(limit). The interceptor validates `skip` and `limit` in `user-validation.ts` and calls `store.list`. `UsersApi.list` sends `skip` and `limit`; `createUsersDatasource` maps AG Grid's row range to them and ignores `sortModel`. The grid sets `sortable: false` and `filter: false` in `defaultColDef`. `UsersPage` shows the total as "N users" and has a `role="status"` line that shows "Loading users…". See proposal.md for why and `specs/` for behavior.

## Goals / Non-Goals

**Goals:**
- Sorted and searched pages from the in-memory API that behave like a real server: parameters, validation and `total`.
- First sorted request under about a second, later pages of the same sort fast.
- No change to unsorted, unsearched paging.

**Non-Goals:**
- Multi-column sort, column filters, search by role or status, or search syntax such as quotes.
- Remembering sort or search across reloads or in the URL.
- Highlighting matched text in cells.

## Decisions

- **Parameters:** `sort=<field>:<asc|desc>` and `q=<text>`, validated in `validateListQuery` beside `validatePage`, returning field errors named `sort` and `q` like the existing 400s. One `sort` string, not separate `sortBy` and `order`, because AG Grid's model and the spec both deal in one column at a time and one parameter cannot arrive half-set.
- **Seed sort orders are built once and cached per field.** The first time a field is requested, the store builds a lower-cased key array for all seeds, sorts an `Int32Array` of seed indices by comparing those keys as plain strings with ties by index, keeps the index array (2 MB) and drops the keys. Descending walks equal-key runs in reverse run order, keeping ids ascending inside a run. Seeds never change, so the cache never goes stale. Task 1.1 timed this in Vitest on Node's V8 (the engine Chromium uses): building email keys 231 ms plus sorting 340 ms, name keys 390 ms plus 373 ms. `Intl.Collator` comparisons took about 1,060 ms per sort, so they were dropped; lower-cased code-unit order differs only for the one accented seed name (Spärck sorts after the unaccented names), which is acceptable for an admin list.
- **Written users merge into the seed order at read time.** For a sorted request the store walks the cached seed order, skips indices that have a written entry, and merges in the written users (sorted by the same comparator on each request; there are few) until it has passed `skip` and collected `limit`. This costs O(skip + limit + written) per page, which for the deepest page is one pass over 500,000 integers. Re-sorting everything after each save was rejected: it would make the next sorted request after every edit take the full build time.
- **Search scans and caches the last result.** A search walks the order in use (id order or a cached sort order), keeps indices whose current name or email contains the lower-cased, trimmed `q`, and stores the resulting index list keyed by `q`, `sort` and a write counter the store bumps on every create and update. Paging through one search reuses the list; a new query, a new sort or any write rebuilds it. Scanning calls `seedUser` for each seed, which task 1.1 timed at 316 ms for "a" (all 500,000 match) and 423 ms for "lamport" (17,241 match). That is under the one-second goal, so lower-cased name and email arrays are not precomputed, which would hold about 50 MB of strings.
- **`total`** is `nextIndex` without `q`, and the match list length with it.
- **Grid:** `defaultColDef.sortable` becomes true with `sortingOrder: ['asc', 'desc', null]`, and `multiSortKey` is left unset while `suppressMultiSort` is true, so Shift-click does not add columns. The datasource reads `params.sortModel[0]` into `sort` and passes the page's current `q`. AG Grid purges the Infinite Row Model cache and returns to the first row when the sort changes. Enter on a focused header sorts it, which AG Grid does by default, and headers get `aria-sort`.
- **Search field:** `UsersPage` adds a `<label for>` "Search users" and an `<input type="search" placeholder="Name or email">` above the grid, wired to a signal. A 300 ms debounce (an `effect` with a timeout, cleared on each change) sets the committed query, and `UsersGrid` gains a `query` input; when it changes the grid calls `purgeInfiniteCache()` and `paginationGoToFirstPage()`. Leading and trailing spaces are ignored, so typing a space does not refetch. The placeholder only hints; the label stays visible.
- **Counts and announcements:** the total line reads "N users" without a query and "N users match" with one. After a load that followed a query change, the existing `role="status"` line reads "N users match" or "No users match" instead of staying empty; paging clears it back to the loading text. The grid's no-rows overlay is set through `overlayNoRowsTemplate` to "No users match your search."
- **URL encoding:** `HttpParams` encodes `q`, and the interceptor reads it with `URLSearchParams`, so text with `@`, `+` or spaces round-trips.

## Risks / Trade-offs

- [Building the email sort order for 500,000 users is slow or memory-heavy in the browser] → Task 1.1 measures build time and heap; the loading text covers it, and the numeric-key fallback above cuts the work if needed.
- [Search scans every seed on each new query] → Debounce limits requests; the cached match list makes paging free; task 1.1 measures a scan.
- [A short query such as "a" matches almost everyone, so the match list holds ~500,000 integers] → An `Int32Array` of that size is about 2 MB, which is acceptable; it is dropped when the query changes.
- [AG Grid's Enter-on-row handler also sees Enter on headers] → `onCellKeyDown` only fires for cells, not headers; the keyboard e2e test checks Enter on a header sorts without navigating.
- [Extending the PDF contract could confuse a reviewer] → The README and the API spec state that `sort` and `q` are additions and that the PDF's parameters behave as before.
