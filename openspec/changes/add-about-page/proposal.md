## Why

A reviewer opening the app sees three screens and a demo control with nothing that explains what the app is, how its fake server behaves, or how it was built. The nav has one working entry, and the user asked for an About page reachable from it.

## What Changes

- Add an About screen at `/about`, written short like a product landing page: what the app does, how its data works, how to try an edit conflict, accessibility, and the development tooling (including OpenSpec and the AI tools used).
- Add a working About entry to the top nav after Settings. Dashboard, Reports and Settings stay placeholders.
- Loosen the navigation spec, which today says every entry other than user management must be a placeholder. The PDF only says other entries *can* be placeholders, so a second working entry stays within it.

## Capabilities

### New Capabilities

- `about-page`: the About screen, its route and title, and the sections it must cover.

### Modified Capabilities

- `admin-navigation`: "Placeholder nav entries" exempts About as well as user management, and "Current screen indicated" gains a scenario for the About screen.

## Impact

- New `src/app/about/about-page.ts` and its unit test; a new lazy route in `src/app/app.routes.ts`; one entry added in `src/app/layout/top-nav.ts`.
- Unit tests for the nav and routes, and the browser suite in `e2e/` (axe, layout, titles, keyboard) gain the About screen.
- `docs/accessibility.md` adds the About screen to its scope and evidence.
- No new dependencies and no API changes.
