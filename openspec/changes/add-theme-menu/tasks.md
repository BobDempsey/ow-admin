## 1. Menu button

- [x] 1.1 Rewrite `ThemeSwitcher` as a "Theme" button with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`, opening a `role="menu"` named Theme with three `menuitemradio` items and a check mark on the selected one, and verify `theme-switcher.spec.ts` cases for roles, names, `aria-checked` and `aria-expanded` in both states, plus its axe check with the menu open
- [x] 1.2 Add keyboard handling (Enter, Space and Down Arrow open on the checked item; Up and Down wrap; Home and End; Enter and Space select, close and refocus the button; Escape closes and refocuses; Tab closes), and verify a `theme-switcher.spec.ts` case for each key
- [x] 1.3 Close on a pointer press outside the host and on focus leaving it, and verify spec cases that a click outside keeps the choice and moving focus into the menu does not close it

## 2. Layout

- [x] 2.1 Style and position the menu below the button, right-aligned, with 44 px items and token colors, adjusting `app.ts`'s header row if needed, and verify screenshots at 1280 and 320 px in both themes with the menu open show it fully on screen without covering the button

## 3. Browser checks

- [x] 3.1 Update `e2e/theme.e2e.ts` to open the menu before choosing, including the keyboard flow in the "Move and choose by keyboard" scenario and Escape, and verify it passes
- [x] 3.2 Add an open Theme menu state to `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` in both themes at 1280 and 320 px, update `e2e/keyboard.e2e.ts` for the header tab order, and verify `npm run test:a11y` passes with port 4600 free

## 4. Docs and checks

- [x] 4.1 Update `docs/accessibility.md` rows 1.3.1, 1.4.11, 2.1.1, 2.4.7 and 4.1.2 and the states count, and `README.md` if it describes the Theme control, and verify `npx prettier --check src e2e` is clean
- [x] 4.2 Run `ng test --watch=false`, `ng build`, `npm run test:a11y` and `openspec validate add-theme-menu --strict`, and verify all pass
