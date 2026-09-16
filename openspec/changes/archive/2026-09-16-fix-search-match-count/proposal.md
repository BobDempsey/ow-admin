## Why

A search with one result reads "1 users match", which is wrong English. The same count also shows twice once a search loads: beside the Users heading and again in the status line under the search field, so sighted admins read it twice. And a Density change in Table settings makes that status line flash "Loading users…", because the grid requests the current page again at the new row height even though the rows on screen stay put.

## What Changes

- The heading total and the status announcement use the singular for a count of 1: "1 user matches" while searching and "1 user" otherwise. Every other count, including 0, keeps the plural.
- The match count shows visibly only beside the heading. The status line under the search field still announces "N users match", "No users match" and the cleared-search total to assistive technology, but that text is visually hidden.
- "Loading users…" stays visible in the status line.
- A Density change re-lays the list without showing or announcing "Loading users…" and without clearing a pending search announcement. Page changes, sort, search and Try again still show it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-list`: "Total count displayed" gains singular wording; "Search result announced" gains singular wording and says the announcement is not shown on screen; a new "Density change reloads quietly" requirement covers the loading line during a density re-lay. The requirement lives in `user-list` because the loading line is on the list screen; `settings-dialog`'s "Table settings" is unchanged.

## Impact

- `src/app/users/users-page.ts`: count wording and the status line's visible and hidden parts.
- `src/app/users/users-page.spec.ts` and `e2e/search.e2e.ts`: wording assertions, including the "1 users match" check in "finds a user created in this session", and a check that the announcement is visually hidden.
- `src/app/users/users-grid.ts` and `src/app/users/users-datasource.ts`: a density re-lay's request does not report loading.
- `src/app/users/users-datasource.spec.ts` and `e2e/settings.e2e.ts`: a density change shows no "Loading users…".
- `docs/accessibility.md`: the 4.1.3 row wording.
- No API or store change.
