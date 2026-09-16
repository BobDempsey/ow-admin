## Context

`UsersPage` (`src/app/users/users-page.ts`) renders the count in two templates: a `<p>` after the `<h1>` built from `total()` and `loadedQuery()`, and the `role="status"` `<p>` built from `announcement()`. Both append " users" and " match" by string concatenation, which is where "1 users match" comes from. The status `<p>` has `min-h-6` so the grid does not jump when its text appears.

`UsersGrid` answers a density change with `setGridOption('rowHeight')` then `refreshInfiniteCache()`, because `resetRowHeights` needs an Enterprise module. The refresh calls the datasource's `getRows`, which emits `loading(true)`; `UsersPage.onLoadingChange` then shows "Loading users…" and clears `announcement()`. `refreshInfiniteCache` keeps the rows on screen while it reloads, so the text is the only flash.

## Goals / Non-Goals

**Goals:**
- One wording function feeds both places, so they cannot disagree.
- The status region stays one live region with a stable DOM node, so screen readers keep announcing it.

**Non-Goals:**
- Wording for other counts on other screens.
- `Intl.PluralRules` or i18n. The app is English only.
- Moving or restyling the heading total.

## Decisions

**A pure `countLabel(total, query)` in `users-page.ts`.** It returns "N user(s)" or "N user(s) match(es)", with N formatted by `toLocaleString('en-US')` to keep today's "500,000". Both templates call it through a `computed()` or directly on the announced value. This drops `DecimalPipe` from the template. Alternative: an `@if (total === 1)` branch in each template, rejected because it duplicates the rule in two places. Alternative: `Intl.PluralRules`, rejected as heavier than a one-line English check, and "match"/"matches" would still need its own branch.

**Hide the announcement with `sr-only` on an inner `<span>`, not on the `<p>`.** The `role="status"` `<p>` stays in place with its `min-h-6`; "Loading users…" renders as plain text and the result renders inside `<span class="sr-only">`. Alternative: `sr-only` on the whole `<p>`, rejected because it would hide the loading message too. Alternative: `aria-live` on a separate hidden region, rejected because swapping regions risks the first announcement being missed and the e2e helper `listStatus` targets the existing node.

**Mark a density reload as quiet in the datasource, not in the page.** `createUsersDatasource` returns the datasource plus a `quietNextLoad()` hook; `UsersGrid` calls it just before `refreshInfiniteCache()` in the density effect. The hook records the current request, which is the last one the datasource received: its `startRow`, `endRow`, sort and query. The next `getRows` stays quiet only when its request matches that record. A quiet request skips `loading(true)` and `loading(false)` but still emits `loaded` and `failed`, so the total stays current and errors still show. A request that AG Grid merges with a page, sort or search change asks for something different, so it reports loading. The mark clears when any `getRows` starts, matching or not, so it never carries into a later request. Alternative: debounce "Loading users…" by a few hundred milliseconds in `UsersPage`, rejected because it delays the message for every load and the 250 ms API latency would still flash near the threshold. Alternative: skip the request and only re-lay rows, rejected because the Infinite Row Model has no Community API to change row height without a refresh.

**Keep `min-h-6` on the status line.** With the result hidden the line is empty after a search, but removing the height would shift the grid by 24 px every time loading starts and stops.

## Risks / Trade-offs

- [Playwright `toHaveText` still reads `sr-only` text, so existing `listStatus` assertions pass without proving the text is hidden] → add an e2e check that the announcement span has Tailwind 4's `clip-path: inset(50%)` (the handoff notes `sr-only` uses `clipPath`, not `clip`).
- [A density change landing next to a page change could mark the page load quiet] → AG Grid's `refreshCache` marks blocks as waiting and calls the block loader, which `blockLoadDebounceMillis` debounces, so a density refresh and a pending page change share one `getRows` call (verified in `ag-grid-community`). A plain per-call flag muted that page load. The datasource therefore stays quiet only when the request matches the one recorded by `quietNextLoad()`; an e2e check changes density in the same tick as Next Page and expects "Loading users…" to appear.
- [e2e `waitForLoaded` waits for "Loading" to leave the status region, so it returns at once after a density change] → the density e2e test waits on the row height instead, as it already polls `firstRowHeight`.
- [`e2e/layout.e2e.ts` clipped-text helper could flag the hidden span] → run `npm run test:a11y` and exempt visually hidden text only if it fails.
