## Context

`/users/:id` renders `UserDetailPage`, a heading only, and there is no create route. `UsersApi` already offers `get`, `create` and `update(id, draft, etag)`, returning `{ data, etag }` and emitting `ApiError` with `status`, `message` and `fieldErrors`. The in-memory server answers `400` with per-field messages, `412` on a stale `If-Match`, and `404` for unknown ids, after 250 ms. `UsersService` has only `loadPage`. The app is zoneless Angular 22.1 with Tailwind 4.1, and `App` focuses the first `h1[tabindex]` in `<main>` after each navigation. `@angular/forms` 22.1.6 ships Signal Forms (`form`, `required`, `email`, `submit`, the `[formField]` directive), public API since 22.0. See proposal.md for scope and the two spec deltas for behavior.

## Goals / Non-Goals

**Goals:**
- One form component tree for create and edit, so labels, error wiring and validation behave the same on both screens.
- The record and its ETag always travel together, so no save can go out with an ETag from a different read.
- Every new state (loading, not found, load failure, saving, saved, save failure, conflict) is announced and keyboard-operable, and passes axe in jsdom and in the browser.

**Non-Goals:**
- A guard that warns about unsaved changes on navigation away.
- Showing the server's current values beside the admin's in the conflict dialog.
- Password reset, delete, and email uniqueness.
- Refreshing the list grid's cached page after a create or save. The grid refetches its page whenever `/users` loads, so returning to the list shows current data.

## Decisions

### Routes and input binding

`users/new` (title `New user`, lazy `new-user-page.ts`) is declared before `users/:id`, so `new` is never read as an id. `provideRouter(routes, withComponentInputBinding())` binds `:id` to `UserDetailPage`'s `id = input.required<string>()`. The alternative, reading `ActivatedRoute.paramMap`, needs an observable bridge for a value the router already offers as an input.

### ETag lives beside the record in the page, not in the service

The handoff's state decision put each loaded user's ETag in `UsersService`. Only the detail screen reads or writes a single user, and holding ETags in a service would add a cache that needs invalidation (after simulate, reload, overwrite) with no second reader. So `UsersService` stays stateless and gains `loadUser(id)`, `createUser(draft)` and `saveUser(id, draft, etag)`, each a Promise of `Versioned<User>` over `UsersApi` with `firstValueFrom`, matching `loadPage`. `UserDetailPage` holds the `Versioned<User>` as one value, so record and ETag cannot drift apart. The handoff's decision is updated when this change lands.

### Loading a user with `resource()`

`UserDetailPage` uses `resource({ params: () => this.id(), loader: ({ params }) => users.loadUser(params) })`. A new id reloads by itself, Try again and Reload call `reload()`, and a successful save or overwrite writes the returned `Versioned<User>` into the resource with `value.set()`, so there is no extra `GET` after a save. `error()` is an `ApiError`; `status === 404` picks the not-found view. This is the single-user use of `resource()` the handoff anticipated.

### Signal Forms with a shared schema and shared fields

- `user-draft-schema.ts` exports `userDraftSchema`: `required` on name and email (name is trimmed before the check), `email` on email. Role and status are `<select>`s over `USER_ROLES` and `USER_STATUSES`, so they cannot hold other values.
- `UserFormFields` (`user-form-fields.ts`) takes `fields = input.required<FieldTree<UserDraft>>()` and renders four labeled controls bound with `[formField]`. Each control has a visible `<label for>`, `aria-invalid` when it has errors after being touched or after a submit attempt, and `aria-describedby` pointing at its error text. Each page owns its `draft` signal, its `form(draft, userDraftSchema)`, its buttons, and its submit handling.
- Submit goes through `submit(form, action)`. Client validation failing stops the request and moves focus to the first invalid control. The action maps an `ApiError` with status `400` onto `ValidationError`s whose `fieldTree` is the matching field (`name`, `email`, `role`, `status`), so server messages show where client ones do. Other statuses are handled by the page and the action returns no errors.
- Reactive forms were the alternative. The project's guidelines prefer Signal Forms for new forms, and a signal draft fits `resource()` and `computed()` without subscriptions.

### Create flow

`NewUserPage` starts the draft as `{ name: '', email: '', role: 'Member', status: 'invited' }`. On success it calls `router.navigate(['/users', id], { state: { notice: 'created' } })`. `UserDetailPage` reads `history.state.notice` once on creation and shows "User created." in its status region. The detail screen then loads the user with its own `GET`, which keeps one load path. A service-held flash message was the alternative; navigation state dies with the history entry, so a later refresh does not repeat the notice.

### Detail screen layout and focus

- One `<h1 tabindex="-1">` element stays in the DOM for every state: "User" while loading, the user's name once loaded, "User not found" on `404`. Changing its text instead of swapping elements keeps the focus `App` placed on it.
- A "Back to users" link above the heading on both screens.
- A `role="status"` region carries "Loading user…", "Saving…", "User saved.", "User created." and the simulate message. A `role="alert"` block carries load failure (with Try again, which focuses the heading first, as on the list) and unexpected save failure.
- The form's draft is reset from the loaded record whenever the resource value changes (load, reload, save). Cancel resets it the same way and sends nothing.
- Save and Cancel are always enabled, with 44 px minimum height. While a save is in flight, the status region reads "Saving…" and Save ignores repeat activation through a busy check rather than `disabled`, so focus does not drop to `<body>`. Save keeps its label, so a screen reader does not hear the button rename itself.

### Conflict dialog

`ConflictDialog` (`conflict-dialog.ts`) wraps a native `<dialog>` opened with `showModal()`, which makes the rest of the page inert and traps focus without extra code. It has `aria-labelledby` on its heading ("This user changed") and `aria-describedby` on its explanation, and three buttons: Keep editing (focused on open, the non-destructive choice), Reload, and Overwrite. The page opens it by calling its `show()` method, and it emits a `choice` output of `'keep' | 'reload' | 'overwrite'` after closing itself. An `open` input was tried first and dropped: when an overwrite's retry answered `412` before the next render, the input went false and back to true unseen and the dialog stayed shut. Escape fires the dialog's `cancel` event, treated as `'keep'`. On close, focus goes back to the Save button explicitly rather than relying on browser restoration, which varies.

- Reload: `resource.reload()`, which resets the draft when the value arrives.
- Overwrite: `loadUser(id)` for the current ETag, then `saveUser(id, draft, freshEtag)`. A second `412` reopens the dialog.

A custom `role="dialog"` with a hand-written focus trap was the alternative; native `<dialog>` is supported in every current browser and gets inertness right.

### Simulated concurrent edit

`UsersService.simulateConcurrentEdit(id)` calls `UsersApi.get(id)` and then `UsersApi.update` with that read's ETag and the status moved to the next value in `USER_STATUSES`, the way a second client would. It returns nothing, so the page's held ETag stays stale. The detail screen shows it below the form in a bordered section headed "Demo", with a line explaining it, and announces "Another admin changed this user. Save to see the conflict." Injecting `UserStore` directly was rejected: it would bypass the HTTP layer the conflict is meant to exercise.

### New user link on the list

`UsersPage` adds `<a routerLink="/users/new">New user</a>` in the heading row, styled as a button (sky-700 background, white text, 44 px minimum height, visible focus outline). It navigates, so it is a link, not a button.

## Risks / Trade-offs

- [jsdom does not implement `HTMLDialogElement.showModal` and `close`] → Tests stub both on the prototype and assert the dialog's `open` attribute and focus calls; the browser check verifies inertness, Escape and focus return.
- [Signal Forms is new, and how `submit` actions target server errors at fields may differ from the typings] → The first form task tests a `400` mapping end to end against the in-memory API before the pages are built on it.
- [`resource()` value writes after save race a reload started at the same time] → Save is ignored while `saving()` or `isLoading()` is true, and Reload is only reachable from the dialog, which closes first.
- [The simulate control is visible in production builds] → It is a take-home demo feature the user chose on 2026-09-14; it lives in one component and one service method, so removing it is two deletions.
- [A created user sits on the last page of 500,001] → The admin lands on the detail screen instead of the list, so they do not need to find it.
- [Overwrite discards another admin's change without showing it] → Accepted per the spec; the dialog text says so before the admin chooses.
