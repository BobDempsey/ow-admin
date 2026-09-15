## Why

The app has only a light theme, so an admin who works with a dark OS setting gets a bright page with no way to change it. The user added a light, dark and system theme switcher to the optional tasks and chose to build it next.

## What Changes

- Add a theme control to the header on every screen with three choices: Light, Dark and System.
- System follows the OS color scheme and is the default for a first visit. The choice is remembered in the browser and applied before the page first paints, so a reload never shows the other theme first.
- Give every screen, the user grid and the conflict dialog a dark appearance that meets WCAG 2.2 AA contrast, with light unchanged from today.
- Move the app's colors from fixed Tailwind palette classes to named color tokens, so each color has one light and one dark value.
- Run the browser accessibility suite in both themes and record both in the conformance report.

## Capabilities

### New Capabilities

- `theme-switcher`: the header theme control, its three choices and default, how System follows the OS, remembering the choice, and which parts of the UI the theme covers.

### Modified Capabilities

- `accessibility`: "Sufficient color contrast" gains a scenario requiring contrast minimums in both the light and dark themes.

## Impact

- `src/styles.css` gains the color tokens, their dark values and a `dark` variant tied to an attribute on `<html>`; the ten component files that use palette classes switch to token classes.
- New theme service and header control with unit tests; `src/app/app.ts` renders the control; `src/index.html` gains a small inline script.
- `src/app/users/users-grid.ts` adds dark AG Grid theme params.
- `e2e/` axe and layout tests run in both themes, with new tests for the control; `docs/accessibility.md` covers both themes; `README.md` mentions the control.
- No new dependencies and no API changes.
