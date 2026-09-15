## Context

The nav (`src/app/layout/top-nav.ts`) renders entries from a `NAV_ENTRIES` array: an entry with a `path` becomes a `routerLink` with `routerLinkActive` and `aria-current="page"`, and one without becomes an `aria-disabled` placeholder button. `App` moves focus to the first `h1[tabindex]` in `<main>` after each navigation, and `PageTitleStrategy` appends `| Orbweaver Admin` to route titles. Screens are lazy standalone components with inline templates and Tailwind classes. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- A static About screen that fits the existing shell, focus handling, title strategy and browser accessibility suite with no new patterns.

**Non-Goals:**
- Serving `docs/accessibility.md` or the README inside the app.
- Changing the placeholder entries or adding more working entries.
- Any runtime data on the page, such as live user counts or version numbers read from `package.json`.

## Decisions

- **About is a data-driven nav entry.** Adding `{ label: 'About', path: '/about' }` after Settings reuses the link branch, so the active style, 44 px target and focus ring come for free. A separate right-aligned link was considered and dropped; the user chose the fifth slot.
- **The page is one static component, `src/app/about/about-page.ts`,** default-exported like the other screens and lazy-loaded from an `about` route declared before `**`. Splitting sections into child components would add files with no state or reuse to justify them.
- **Copy is fixed text in the template, kept to landing-page length.** Headings are short noun phrases; each section is one or two sentences or a short list. The copy follows the repo owner's prose rules: no em dashes, active voice, sentence-case headings.
- **The accessibility report is named, not linked.** The app does not serve repo files, so the page names `docs/accessibility.md` as code text. Linking to a hosted copy would need a URL the project does not have.
- **Tooling list comes from `package.json`, `.mcp.json` and the handoff:** Angular CLI 22, TypeScript 6, Tailwind CSS 4, Vitest 4 with jsdom, axe-core, Playwright with `@axe-core/playwright`, Prettier, OpenSpec, Node 24 and npm, Git with Conventional Commits, the NVDA screen reader, and the AI tools Claude Code, the Angular CLI MCP server and the Playwright MCP server. Versions are major or minor only, so patch upgrades do not make the page wrong.
- **Links use `routerLink`** to `/users` and `/users/new`, with the underlined sky-700 link style from `new-user-page.ts`.

## Risks / Trade-offs

- [Version numbers on the page go stale after upgrades] → Only major or minor versions are shown, and the handoff notes the page when tooling changes.
- [Five nav entries wrap sooner at narrow widths] → The nav already wraps; `e2e/layout.e2e.ts` checks reflow and target size on every screen, and About is added to it.
- [The keyboard e2e test that Tabs from Users to Reports still passes, but new tests could assume Settings is last] → The new keyboard test names About explicitly.
