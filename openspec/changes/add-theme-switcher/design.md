## Context

Colors are fixed Tailwind palette classes in inline templates across ten component files (about 30 distinct slate, sky, red and white classes), plus a `bg-white text-slate-900` host class on `App`. The header is `bg-slate-900` with white nav text. `src/styles.css` holds only `@import 'tailwindcss'` and AG Grid layout fixes. The grid theme in `users-grid.ts` is `themeQuartz.withParams({...})` with light hex values and a solid sky-700 focus ring for 3:1. There is no root service for UI preferences yet. The browser suite in `e2e/` checks axe, reflow, text spacing, zoom and focus at 1280 and 320 px, light only. See proposal.md for why, and `specs/` for the required behavior.

## Goals / Non-Goals

**Goals:**
- One place that defines each color's light and dark value.
- Light theme pixels unchanged, so the existing light evidence in `docs/accessibility.md` stays valid.
- No flash of the wrong theme on load.

**Non-Goals:**
- More than two themes, high contrast mode, or `forced-colors` work beyond what browsers already do.
- Syncing the choice across tabs through `storage` events; another tab picks it up on its next load.
- Storing the choice anywhere but the browser; the app has no accounts.
- Restyling the light theme or changing layout. The nav drawer is a separate optional task.

## Decisions

- **Named color tokens in `@theme`, dark values under an attribute.** `src/styles.css` defines tokens such as `--color-surface`, `--color-surface-muted`, `--color-ink`, `--color-ink-muted`, `--color-line`, `--color-line-strong`, `--color-accent`, `--color-accent-hover`, `--color-focus`, `--color-danger`, `--color-danger-surface` and `--color-danger-line`, with light values equal to today's palette colors. `:root[data-theme='dark']` redefines them. Tailwind 4 utilities reference theme variables through `var()`, so `bg-surface` follows the override with no `dark:` class. The final token list comes from mapping each existing class during implementation; two classes with the same role share a token. The user chose tokens over adding `dark:` next to every class, because dark values then live in one file and contrast is checked per token pair rather than per template.
- **`@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))`** is still declared, so a rare one-off (such as a shadow) can use `dark:` tied to the same attribute instead of the OS media query.
- **The header stays dark in both themes.** Its tokens (`--color-header`, `--color-header-ink`, `--color-header-muted`) keep slate-900 and white in light, and in dark move to a slightly different dark with a bottom border so it still separates from a dark page. The nav's contrast figures stay as they are in light.
- **`color-scheme` comes from CSS:** `:root { color-scheme: light }` and `:root[data-theme='dark'] { color-scheme: dark }`, so native selects, scrollbars and the `<dialog>` backdrop follow the attribute.
- **`<html data-theme>` always holds the resolved theme (`light` or `dark`), never `system`.** CSS then needs no media query, and every consumer reads one attribute. `data-ag-theme-mode` on `<html>` mirrors it for AG Grid.
- **An inline script in `src/index.html` `<head>`** reads `localStorage['orbweaver-admin-theme']`, resolves `system` with `matchMedia('(prefers-color-scheme: dark)')`, and sets both attributes before the stylesheet paints. It is wrapped in `try`/`catch` and falls back to System. This follows Tailwind's documented pattern and is the only way to meet the no-flash scenario, since Angular boots after first paint.
- **`ThemeService` (`src/app/core/theme.service.ts`, `@Service`)** holds `preference = signal<'light' | 'dark' | 'system'>` read from storage at construction, a `systemPrefersDark` signal fed by a `matchMedia` `change` listener, a `computed` resolved theme, and an `effect` that writes both attributes and the storage key. Storage reads and writes are in `try`/`catch`. When `matchMedia` is missing (jsdom), the service treats the system scheme as light, so existing specs that render `App` keep working without a stub.
- **`ThemeSwitcher` (`src/app/layout/theme-switcher.ts`)** is a `fieldset` with legend "Theme" and three native radio inputs sharing one `name`, drawn as a segmented control with visually hidden inputs and styled labels. Native radios give the arrow-key behavior, the group name and checked state without custom ARIA. The checked label gets a visible border and bold text, not only a color change (WCAG 1.4.1), and the focus ring moves to the label with `has-[:focus-visible]`. Labels are at least 44 px tall to match the nav. It sits in `App`'s header after `TopNav`, right-aligned at wide widths and wrapping below the nav at 320 px. A select or a single cycling button were considered; a select hides the current value behind a click, and a cycling button does not show all three choices.
- **AG Grid dark params** chain onto the existing theme: `themeQuartz.withParams(light).withParams(dark, 'dark')`, with dark values taken from the token hexes, including a focus ring that meets 3:1 on the dark header row. AG Grid reads the mode from `data-ag-theme-mode`, so the grid needs no code tied to the service. Checked against ag-grid.com's theming colors page for 36.1.0.
- **The browser suite runs axe and layout checks in both themes** by wrapping the existing `STATES` and `SCREENS` loops in a loop over `colorScheme: 'light' | 'dark'` with `test.use({ colorScheme })`. With no stored choice the app follows System, so the emulated scheme sets the theme with no helper. A new `e2e/theme.e2e.ts` covers choosing by keyboard, the reload scenario (including the first frame), System following `page.emulateMedia` changes, and a thrown `localStorage.setItem`. Running the whole suite as a second Playwright project was rejected because keyboard and grid tests gain nothing from a second theme and the run time would double.

## Risks / Trade-offs

- [Some light colors shift while mapping classes to shared tokens] → Light values are the exact existing hexes, two classes merge only when they already share a role, and the light axe and layout tests plus before and after screenshots of each screen at 1280 px catch visible changes.
- [Dark tokens fail contrast in a state the suite does not open] → Token pairs are checked by hand with a contrast calculator and listed in `docs/accessibility.md`, and axe runs in dark on all ten states at both widths.
- [The inline script and the service disagree on the storage key or values] → Both use the key `orbweaver-admin-theme` and the values `light`, `dark` and `system`; an e2e test sets storage, reloads, and checks the attribute before Angular renders the header.
- [The extra header control makes the nav wrap to more rows at 320 px] → The layout suite already checks reflow, target size and focus not obscured at 320 px on every screen, and runs in both themes.
- [Doubling the axe and layout tests lengthens `npm run test:a11y`] → Only those two files double; keyboard, grid, titles and support tests run once.
- [Tailwind 4 behavior around `@theme` variable overrides differs from what the design assumes] → Task 1.1 confirms with a one-token spike in the browser before mapping every class.
