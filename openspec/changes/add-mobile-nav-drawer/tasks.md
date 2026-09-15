## 1. Drawer

- [ ] 1.1 Add `NavDrawer` as a native `<dialog>` styled as a left drawer, taking the entry list as an input and rendering links, placeholders and `aria-current` the same way the bar does, with a Close button, and verify `nav-drawer.spec.ts` (using `stubDialogMethods()`) covers the entries, the current marking, Close, Escape and a backdrop click
- [ ] 1.2 Close the drawer on `NavigationEnd` without restoring focus, and return focus to the Menu button when it closes any other way, and verify spec cases for both paths

## 2. Header

- [ ] 2.1 Show the entry `<ul>` with `hidden md:flex` and a Menu button with `md:hidden` in `TopNav`, pass the same `NAV_ENTRIES` to the drawer, and verify `top-nav.spec.ts` checks the button's name and that both renderings come from one array
- [ ] 2.2 Check the header at 1280 and 320 px in both themes with the drawer closed and open, and verify screenshots show no Menu button at 1280 px, one header row at 320 px, and a drawer that fits the viewport

## 3. Browser checks

- [ ] 3.1 Add an `openNavDrawer` helper to `e2e/support/app.ts`, update the 320 px tests that use nav entries in `e2e/keyboard.e2e.ts` and `e2e/titles.e2e.ts`, and verify they pass
- [ ] 3.2 Add an open drawer state at 320 px in both themes to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts`, covering reflow, target size and focus not obscured, and verify `npm run test:a11y` passes with port 4600 free

## 4. Docs and checks

- [ ] 4.1 Update `docs/accessibility.md` rows 1.3.1, 1.4.10, 2.1.1, 2.4.3, 2.4.7 and 4.1.2 and its state count for the drawer, and `README.md` if it describes the navigation, and verify `npx prettier --check src e2e` is clean
- [ ] 4.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` and `openspec validate add-mobile-nav-drawer --strict`, and verify all pass
