## 1. Color tokens

- [x] 1.1 Add one token (`--color-surface`) in `@theme` with a `:root[data-theme='dark']` override, the `dark` custom variant and `color-scheme` rules to `src/styles.css`, and verify in the dev server that `bg-surface` changes when `data-theme="dark"` is set on `<html>` by hand
- [x] 1.2 Take screenshots of the list, new user with errors, detail, not found, conflict dialog and About at 1280 px in the current light theme, and verify six files are saved under `test-results/` for comparison
- [x] 1.3 Define every light token with today's exact hexes and map the palette classes in the ten component files and `App`'s host class to token classes, and verify a search of `src/app` finds no `slate-`, `sky-`, `red-`, `bg-white` or `text-white` classes and `ng test --watch=false` passes
- [x] 1.4 Compare new light screenshots with the ones from 1.2, and verify no visible difference and `npm run test:a11y` passes unchanged
- [x] 1.5 Add dark values for every token and the header tokens, check each text, border and focus pair with a contrast calculator, and verify each pair meets 4.5:1 for text or 3:1 for non-text in a table kept for task 5.1

## 2. Theme state

- [x] 2.1 Add `ThemeService` with the preference, system and resolved signals, the attribute and storage effect, and the `matchMedia` fallback, and verify `theme.service.spec.ts` covers the System default, a stored choice, a scheme change under System, a throwing `localStorage`, and missing `matchMedia`
- [x] 2.2 Add the inline script to `src/index.html` using the same key and values, and verify in the dev server that with `dark` stored a reload shows no light frame (Performance panel screenshots or a paused script) and `ng build` passes

## 3. Theme control

- [x] 3.1 Add `ThemeSwitcher` with the fieldset, legend "Theme", three native radios and the checked and focus styles, and verify `theme-switcher.spec.ts` checks the group name, three radios, the checked state following the service, selection updating the service, and `expectNoAxeViolations`
- [x] 3.2 Render `ThemeSwitcher` in `App`'s header after `TopNav`, and verify `app.spec.ts` finds the Theme group on the shell and the browser shows it right-aligned at 1280 px and wrapped without sideways scroll at 320 px

## 4. Grid

- [x] 4.1 Add dark AG Grid params with `withParams(dark, 'dark')` using the token hexes, and verify in the dev server with Dark chosen that rows, headers, the pagination panel and the focus ring are dark themed and the ring meets 3:1

## 5. Browser suite and report

- [x] 5.1 Wrap the `STATES` loop in `e2e/axe.e2e.ts` and the `SCREENS` loop in `e2e/layout.e2e.ts` in light and dark `colorScheme` runs, and verify both pass in both themes at 1280 and 320 px
- [x] 5.2 Add `e2e/theme.e2e.ts` for choosing Dark by keyboard, a reload keeping Dark with `data-theme="dark"` before the header renders, System following `page.emulateMedia`, and a throwing `localStorage.setItem`, and verify it passes
- [x] 5.3 Update `docs/accessibility.md` for both themes (scope, 1.4.1, 1.4.3, 1.4.11 with the dark contrast table, 2.4.7, 4.1.2 and the axe state count) and add the Theme control to `README.md`, and verify every changed row names its evidence and neither file has an em dash
- [x] 5.4 Verify `ng test --watch=false`, `ng build`, `npm run test:a11y`, `npx prettier --check src e2e` and `openspec validate add-theme-switcher --strict` all pass, and check in the browser at 1280 and 320 px that every screen and the dialog look right in Light, Dark and System
