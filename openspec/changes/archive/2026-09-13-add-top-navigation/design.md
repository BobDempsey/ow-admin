## Context

`src/app/app.html` is the 353-line CLI starter page and `app.routes.ts` is empty. The API layer from `build-user-api-client` is provided in `app.config.ts` but nothing calls it yet. No brand guide or mockup exists, so the look comes from Tailwind's default palette and type scale. See proposal.md for scope.

## Goals / Non-Goals

**Goals:**
- A shell every later screen renders inside, with landmarks, skip link, titles and focus handling done once.
- Meet WCAG 2.2 AA for the shell: contrast, focus visible and not obscured (2.4.7, 2.4.11), target size (2.5.8), reflow (1.4.10), use of color (1.4.1), bypass blocks (2.4.1), page titled (2.4.2).

**Non-Goals:**
- The user list itself. `/users` shows a heading only.
- A collapsible "hamburger" menu. Four short entries wrap at 320 px, and a disclosure menu would add a focus-trapping widget with no benefit.
- Dark mode, user avatar or sign-out controls. The PDF asks for none.

## Decisions

### Shell layout in `App`

`App` renders, in order: a skip link (`sr-only` until focused), `<app-top-nav>` inside `<header>`, and `<main id="main" tabindex="-1">` holding `<router-outlet>`. `app.html` and `app.css` are deleted in favour of an inline template. The skip link keeps `href="#main"` but handles its click, preventing the default and focusing `<main>`: under `<base href="/">` a bare fragment link resolves to `/#main` and would change the URL. Keeping the shell in `App` avoids a layout route that would add nesting for a single layout.

### `TopNav` component

`src/app/layout/top-nav.ts`, inline template, holds the entries as a constant array of `{ label, path? }`. Entries with a path render as `<a routerLink routerLinkActive ariaCurrentWhenActive="page">`. `RouterLinkActive` sets `aria-current` itself, so no custom active tracking is needed.

Placeholders render as `<button type="button" aria-disabled="true">` with visually hidden text "(not available yet)". Alternatives: a native `disabled` button drops out of the tab order, so keyboard and screen reader users would not learn the entry exists; a link with `href="#"` changes the URL and reads as navigable. `aria-disabled` keeps focus and announces "dimmed" or "unavailable".

Order: Dashboard, Users, Reports, Settings, with the "Orbweaver Admin" wordmark as a link to `/users` on the left. The labels are invented; the PDF names only user management.

### Visual treatment

- Header: `bg-slate-900`, text `text-white` (about 17:1). Placeholders `text-slate-300` (about 12:1), so they stay readable even though disabled controls are exempt from contrast.
- Active entry: `font-semibold` plus a 3 px bottom border in `border-sky-400`. The border shape carries the state for users who cannot see the color difference.
- Hover: `bg-slate-800` on links only.
- Focus: `focus-visible:outline-2 outline-offset-2 outline-sky-400` on every entry and the skip link; sky-400 on slate-900 is above 3:1 for non-text contrast.
- Targets: each entry is at least 44 px tall with horizontal padding, above the 24 px minimum.
- Layout: `flex flex-wrap` so entries move to a second row below about 400 px; the header is not `sticky`, so it can never cover focused content (2.4.11).

### Default and unknown routes

`''` and `'**'` redirect to `users`. A not-found screen is deferred until there is more than one real screen to fall back to.

### Lazy `/users` route

`{ path: 'users', title: 'Users', loadComponent: () => import('./users/users-page') }`. `UsersPage` renders `<h1 tabindex="-1">Users</h1>` for now. The user list task replaces its body and keeps the heading.

### Titles through `TitleStrategy`

`PageTitleStrategy` extends `TitleStrategy` and sets `${title} | Orbweaver Admin`, falling back to `Orbweaver Admin`. It is registered in `app.config.ts` with `{ provide: TitleStrategy, useClass: PageTitleStrategy }`. `index.html` gets `Orbweaver Admin` as the initial title.

Alternative: set `Title` in each page component. That scatters the suffix across screens.

### Focus after navigation

`App` listens for `NavigationEnd`, skips the first one (initial load should leave focus at the top of the document), and in `afterNextRender` focuses the first `h1` inside `<main>`, falling back to `<main>` itself. Screens therefore need an `h1` with `tabindex="-1"`, which is documented here and in the users page.

Alternative: focus `<main>` always. Screen readers then announce the whole region, not the screen name.

### Accessibility tests with axe-core

`axe-core` runs against the rendered shell in Vitest (jsdom) and fails the test on any violation. jsdom cannot compute layout, so axe's `color-contrast` rule reports as incomplete, not passed; contrast is checked by the ratios above and by a manual pass in the browser. A small helper `expectNoAxeViolations(element)` lives in `src/testing/axe.ts` for later screens to reuse.

Alternative: `vitest-axe` matchers. It wraps the same engine with another dependency and lags Vitest releases.

## Risks / Trade-offs

- [Invented placeholder labels may not match what reviewers expect] → They are one array in `top-nav.ts`.
- [Focus moving on every navigation can surprise sighted mouse users] → Focus goes to a heading with no visible outline change (`focus:outline-none` on the `h1` only; it is not interactive), so nothing flashes.
- [axe in jsdom misses contrast and reflow] → Reflow and contrast are verified manually at 320 px in the browser as a task.
