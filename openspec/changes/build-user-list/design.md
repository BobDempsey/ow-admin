## Context

`/users` renders `UsersPage` (`src/app/users/users-page.ts`), a heading only. `UsersApi` in `src/app/core/api/` returns `{ items, total }` for `list({ skip, limit })` and emits `ApiError` on failure; the in-memory server caps `limit` at 100 and answers after 250 ms. The app is zoneless Angular 22.1 with Tailwind 4.1. `App` focuses the first `h1[tabindex]` in `<main>` after navigation. See proposal.md for scope and specs/user-list/spec.md for the behavior.

AG Grid facts behind the decisions below were checked against the AG Grid 36 docs on 2026-09-13 (`ag-grid-angular` 36.1.0 on npm, peer `@angular/core >= 20`): the Infinite Row Model and pagination are Community features registered as `InfiniteRowModelModule` and `PaginationModule`; `cacheBlockSize` must be at least the page size; AG Grid 36 supports Angular 20 to 22 and zoneless apps without extra setup; themes are objects passed through `[theme]` (`themeQuartz.withParams(...)`), with no CSS imports.

## Goals / Non-Goals

**Goals:**
- One `GET /users` per page shown, with the grid holding no more than the current page.
- The list and its grid meet WCAG 2.2 AA where AG Grid lets us: focus visible, target size, text contrast, status and error messages announced.

**Non-Goals:**
- Sort, filter and search. They are optional tasks and need API contract changes.
- The user detail, create and edit screens. `/users/:id` gets a placeholder heading.
- A "New user" button. It lands with the create screen.
- Replacing AG Grid's pagination panel with our own. We check the built-in panel in the browser and record any gaps for the WCAG task.

## Decisions

### One request per page: block size follows page size

`cacheBlockSize` is bound to the current page size and `maxBlocksInCache` is 1, so every page is exactly one block and one request, and going back to an earlier page requests it again. The user chose this over fetching 100 rows and paging through them locally, because the `user-list` spec says each page move issues a new request.

When the admin picks a new size in the pagination panel, the grid handles `paginationChanged` with `newPageSize`, calls `api.setGridOption('cacheBlockSize', api.paginationGetPageSize())`, then `purgeInfiniteCache()` and `paginationGoToFirstPage()`. The grid reloads on a size change by itself, before that handler runs, with the old block size: switching from 25 to 50 first fired `skip=0&limit=25` and `skip=25&limit=25`. `blockLoadDebounceMillis` of 50 holds those loads long enough for the purge to cancel them, and the browser check on 2026-09-13 then saw a single `skip=0&limit=50`. Re-creating the grid was not needed.

### Datasource as a plain function

`createUsersDatasource(loadPage, events)` in `src/app/users/users-datasource.ts` returns an AG Grid `IDatasource`. `getRows` maps `startRow` to `skip` and `endRow - startRow` to `limit`, calls `successCallback(items, total)` so the grid knows the last row, and calls `failCallback()` on error. `events` has `loading(boolean)`, `loaded(total)` and `failed(error)` hooks the page uses to set its signals.

Keeping it free of Angular and of the grid instance means the skip/limit mapping and error path are unit tested directly, which matters because jsdom has no layout and grid rendering there is unreliable.

### `UsersService` without `resource()`

The state decision in the handoff named `resource()` for loading pages. AG Grid's Infinite Row Model pulls rows by calling `getRows` when it needs them, so the grid, not a reactive request signal, decides when to load. Wrapping that in `resource()` would mean feeding the grid's callback into a signal and back out again. `UsersService` (`@Service()`, `src/app/users/users.service.ts`) instead exposes `loadPage({ skip, limit }): Promise<UserPage>` over `UsersApi.list` with `firstValueFrom`. The list endpoint returns no ETags, so the "ETags beside records" half of the decision starts with the user management task, which reads single users. The service stays the one place screens reach the API, and later screens can still use `resource()` for single-user loads.

### Page composition

`UsersPage` keeps its `h1 tabindex="-1"` and adds:
- A line under the heading with the total (`500,000 users`, formatted with `DecimalPipe`), shown once the first page answers.
- A `role="status"` region that reads "Loading users…" while a request is in flight and is empty otherwise.
- A `role="alert"` block, rendered only after a failure, with the message "Users could not be loaded." and a Try again button that moves focus to the heading, clears the error and calls `api.refreshInfiniteCache()`. The button leaves the DOM with the alert, so without the focus move keyboard focus fell to `<body>`.
- The grid, in its own component `UsersGrid` (`src/app/users/users-grid.ts`) with outputs for `loading`, `loaded`, `failed` and an `openUser` output, so `UsersPage` holds the page-level state and navigation.

### Columns and cells

Columns: Name, Email, Role, Status, all `sortable: false` and `filter: false` (the API cannot sort or filter). Name renders through `UserNameCell`, a small Angular cell component holding `<a [routerLink]="['/users', id]">`. Status renders as text. Rows still loading have no data; cells show nothing and the status region carries the loading message.

### Opening a user

- Click anywhere on a row: `rowClicked` emits `openUser` unless the click target is inside the name link, which navigates by itself and keeps middle-click and modifier-click working.
- Keyboard: `cellKeyDown` with `Enter` on any cell of a loaded row emits `openUser`. AG Grid does not move Tab into cell contents by default, so Enter is the keyboard path, and the link in the name cell gives screen reader users a named, navigable target.
- Tab: by default AG Grid's Tab steps through every header and body cell, 100 stops at 25 rows, before reaching the pagination panel. `tabToNextCell` and `tabToNextHeader` return `false`, so Tab leaves the grid and the grid is one tab stop, with arrow keys moving between cells.
- `UsersPage` handles `openUser` with `router.navigate(['/users', id])`.

Alternative: `suppressKeyboardEvent` to let Tab reach the link inside the cell. It fights the grid's own Tab handling and adds a stop per row for sighted keyboard users.

### Module registration and bundle

`ModuleRegistry.registerModules([InfiniteRowModelModule, PaginationModule, ...])` runs at module scope in `users-grid.ts`, so AG Grid ships only in the lazy `/users` chunk. Any other module the grid reports as missing in the console is added to that list. `AllCommunityModule` is avoided to keep the chunk smaller.

### Layout and theme

- `domLayout: 'autoHeight'` so every row on the page is in the DOM, there is no scroll box inside the page, and screen readers see all rows. At 100 rows that is a long page, which is acceptable. If autoHeight misbehaves with the Infinite Row Model, fall back to a fixed height sized for 25 rows.
- `ensureDomOrder: true`, as AG Grid recommends for screen readers.
- `themeQuartz.withParams` with Tailwind's slate and sky values: `foregroundColor` slate-900, `headerBackgroundColor` slate-50, `borderColor` slate-200, `accentColor` sky-700 (about 5.9:1 on white), `fontFamily` inherited, `rowHeight` 44 so each row meets the target size.
- `focusShadow` is a solid 3 px sky-700 ring. Quartz's default draws it at half opacity, which measured below 3:1 on the slate-50 header.
- Two global rules in `src/styles.css`, scoped to `app-users-grid`: the pagination panel's content wraps instead of scrolling sideways inside a fixed 48 px row at 320 px, and each paging button gets a 24 px minimum target (they are 16 px icons by default).
- Below the grid's minimum width the grid scrolls horizontally inside its own box. Data tables are an exception to reflow (1.4.10), and the page itself must still not scroll sideways at 320 px.

### Detail placeholder route

`{ path: 'users/:id', title: 'User', loadComponent: () => import('./users/user-detail-page') }` with `<h1 tabindex="-1">User</h1>`, so navigation from the list has somewhere to land and focus moves to a heading. The user management task replaces it.

## Risks / Trade-offs

- [AG Grid does not render reliably in jsdom] → Unit test the datasource, service and page state with a stubbed grid output; verify the rendered grid, pagination panel and keyboard path in the browser with Playwright.
- [A live `cacheBlockSize` change may not apply] → Test it; fall back to re-creating the grid on page size change.
- [AG Grid claims WCAG 2.0 AA, not 2.2, and the pagination panel's labels and target sizes are unverified] → Browser check with keyboard and axe; record gaps in the handoff for the WCAG 2.2 task instead of rebuilding the panel here.
- [`maxBlocksInCache: 1` refetches a page when the admin goes back] → Intended: each page move is one request, and a 25-row request against the in-memory store costs one 250 ms wait.
- [Enter on a row navigates, which a screen reader user may not expect from a grid cell] → The name cell is also a named link, and the pattern is recorded for the accessibility task to review.
