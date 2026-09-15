# Orbweaver Admin

Orbweaver Admin is an admin UI for managing users. It has a top navigation bar, a paged list of 500,000 users, screens to create, view and edit a user, and an About page. The app runs entirely in the browser: a client-side API layer answers HTTP requests from an in-memory store, so there is no backend to start.

It uses Angular 22 (standalone components, signals, Signal Forms, zoneless), Tailwind CSS 4, and AG Grid Community for the list.

## Running the app

Install dependencies, then start the dev server:

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The app redirects to the user list at `/users`.

## Screens

- `/users` lists users 25, 50 or 100 at a time. Each page is one request to the API. Click a row, or press Enter on a focused row, to open that user. Click a column header, or press Enter on a focused one, to sort by it, and type in Search users to find people by name or email.
- `/users/new` creates a user. On success the app opens the new user's detail screen. New users take the next index, so they appear on the last page of the list.
- `/users/:id` shows a user as an editable form with Save and Cancel.
- `/about` explains the app and how to try it.

Dashboard and Reports in the navigation are placeholders and do nothing.

The Theme control in the header switches between Light, Dark and System. System follows your OS color scheme and is the default. The app remembers your choice in this browser.

Settings in the navigation opens a dialog with the same theme choice and three settings for the user list: Striped rows, Density (Comfortable or Compact) and Draggable columns. Changes apply at once and are remembered in this browser. Draggable columns is off by default because dragging is then the only way to move a column, which fails WCAG 2.5.7; the dialog says so when you turn it on.

## How the API layer works

The typed client is `UsersApi` in `src/app/core/api/`. It calls `HttpClient`, and `inMemoryApiInterceptor` answers every request under `/api` with a real `HttpResponse` or `HttpErrorResponse`, including status codes and headers.

| Method and path                       | Result                                                                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/users?skip&limit`           | 200 with `items` and `total`. `limit` defaults to 25 and is capped at 100.                                                                                                                            |
| `GET /api/users?sort=name:asc`        | Added beyond the PDF contract. Sorts by `name`, `email`, `role` or `status`, `asc` or `desc`, ignoring case, ties by id. 400 for any other value.                                                     |
| `GET /api/users?q=text`               | Added beyond the PDF contract. Only users whose name or email contains the text, ignoring case, with `total` counting the matches. Combines with `sort`, `skip` and `limit`. 400 over 100 characters. |
| `GET /api/users/{id}`                 | 200 with an `ETag`, or 404.                                                                                                                                                                           |
| `POST /api/users`                     | 201 with `ETag` and `Location`, or 400 with `fieldErrors`.                                                                                                                                            |
| `PUT /api/users/{id}`                 | 200 with a new `ETag`. 428 without `If-Match`, 412 when the `If-Match` ETag is stale, 400 on invalid fields.                                                                                          |
| `POST /api/users/{id}/password-reset` | 204. No UI calls it yet.                                                                                                                                                                              |

Other methods on a known path return 405 with an `Allow` header.

The store generates the 500,000 seeded users (`u-000000` to `u-499999`) from their index when they are read, and keeps only created or edited users in memory, so a page costs the same at any offset. Every response waits 250 ms (`API_LATENCY_MS`) so loading states are visible. The store resets when you reload the page.

A user has a name, an email, a role (`Admin`, `Member` or `Viewer`) and a status (`active`, `invited` or `suspended`). Email uniqueness is not enforced.

## Trying an edit conflict

Updates use optimistic concurrency: the detail screen holds the user's ETag and sends it as `If-Match`. Because the store lives in one browser tab, the detail screen has a Demo section to produce a conflict:

1. Open any user, for example `/users/u-000042`.
2. Change a field, but do not save.
3. Select "Simulate an edit by another admin". This saves a change to the user's status behind the form, so the form's ETag goes stale.
4. Select Save. The API answers 412 and a dialog opens.

The dialog offers Keep editing (close it and keep your changes), Reload (discard your changes and show the latest version) and Overwrite (save your changes over the other edit).

## Requirements

The requirements live as OpenSpec specs in `openspec/specs/`. Completed changes, with their proposals, designs and task lists, are in `openspec/changes/archive/`.

## Building

```bash
npm run build
```

The build output goes to `dist/`.

## Running unit tests

The unit tests run with [Vitest](https://vitest.dev/) in jsdom:

```bash
npm test
```

## Running accessibility tests

The browser accessibility suite runs Playwright and axe against the dev server, which it starts on port 4600. Stop anything already listening there first.

```bash
npm run test:a11y
```

The results and the WCAG 2.2 conformance report are in `docs/accessibility.md`.
