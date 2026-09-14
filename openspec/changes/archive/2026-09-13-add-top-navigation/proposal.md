## Why

The app still shows the Angular CLI starter page, and the PDF's first requirement is a top navigation bar with an entry that reaches the user management screen. Every later screen renders inside the shell this change creates, so the nav, routing and page-level accessibility need to exist before the user list is built.

## What Changes

- Replace the starter page with an app shell: a skip link, a header holding the top nav bar, and a `<main>` region that hosts routed screens.
- Add a Users nav entry that routes to `/users`, plus Dashboard, Reports and Settings as placeholder entries that do nothing when activated.
- Add a lazy-loaded `/users` route with a placeholder screen (a heading only). The user list task fills it in.
- Redirect `/` and unknown URLs to `/users`, since user management is the only built screen.
- Mark the current screen's nav entry with `aria-current="page"` and a visible indicator that does not rely on color alone.
- Give each screen its own document title and move focus to the screen's heading after in-app navigation.
- Make the nav usable at 320 CSS pixels wide without horizontal scrolling.
- Add automated accessibility checks for the shell with `axe-core` as a dev dependency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-navigation`: adds requirements for indicating the current screen, announcing placeholder entries as unavailable, a skip link, a document title per screen, and reflow at narrow widths.

## Impact

- Replaces `src/app/app.html` and `src/app/app.css` and changes `src/app/app.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts` and `src/app/app.spec.ts`.
- New code under `src/app/layout/` and `src/app/users/`.
- New dev dependency: `axe-core` (MPL-2.0), used only in tests and absent from the production bundle.
- Satisfies the `accessibility` spec's "focus moves into a new view" scenario for screen navigation. Dialog focus stays with the user management task.
