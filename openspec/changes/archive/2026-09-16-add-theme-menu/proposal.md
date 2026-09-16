## Why

The header's Theme control is three always-visible choices (Light, Dark, System) beside the nav. It takes a whole row of the header at 320 px, and the user plans to show the choices as icons later, which suits a compact menu better than a row of text buttons.

## What Changes

- **BREAKING** The Theme control becomes one "Theme" button in the header that opens a small menu of Light, Dark and System. The three visible radios go away.
- The menu marks the current choice with a check mark, applies a choice as soon as it is picked, then closes and returns focus to the button.
- The menu opens and closes by pointer and keyboard: Enter, Space or Down Arrow opens it, arrow keys, Home and End move through it, and Escape, Tab or a click outside closes it.
- Each choice keeps its text name, so a later change can swap the visible text for icons without changing what assistive technology announces.
- Theme behavior itself (applying, following the OS, remembering the choice, the pre-render script) does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `theme-switcher`: "Theme control in the header" becomes a menu button with checkable choices, and a new "Theme menu opening and closing" requirement covers the keyboard and pointer behavior.

## Impact

- `src/app/layout/theme-switcher.ts` and `theme-switcher.spec.ts`: rewritten as a menu button.
- `src/app/app.ts`: the header row may need its alignment adjusted for a single button.
- `e2e/theme.e2e.ts`: open the menu before choosing; `e2e/axe.e2e.ts` and `e2e/layout.e2e.ts` gain an open-menu state; `e2e/keyboard.e2e.ts` tab order.
- `docs/accessibility.md` rows 1.3.1, 1.4.11, 2.1.1, 2.4.7 and 4.1.2, and `README.md` if it describes the control.
- `e2e/settings.e2e.ts` reads the header's Theme radios today; `polish-settings-dialog` removes that test, so apply this change after it.
- No change to `ThemeService`, storage or `src/index.html`.
