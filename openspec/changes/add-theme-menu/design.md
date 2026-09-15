## Context

`ThemeSwitcher` (`src/app/layout/theme-switcher.ts`) is a `fieldset` with the legend "Theme" and three visually hidden native radios whose labels draw a segmented control on the slate header. `ThemeService` holds the preference and applies it; the switcher only reads `preference()` and calls `choose()`. `App` puts `TopNav` and the switcher in one wrapping header row, and at 320 px the switcher takes its own row. The workspace has no `@angular/cdk`, and the reviewing team builds UI in-house (see the handoff's Components decision).

## Goals / Non-Goals

**Goals:**
- A menu button that follows the WAI-ARIA Authoring Practices menu button pattern with `menuitemradio` items.
- A component whose item labels can become icons later by changing only the visible markup.

**Non-Goals:**
- The icons themselves.
- Type-ahead in the menu. Three items do not need it.
- Any change to `ThemeService`, storage keys or the pre-render script in `src/index.html`.

## Decisions

**Menu button with `menuitemradio`, not a disclosure around the radios.** The button gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the popup is `role="menu"` with an accessible name of "Theme" and three `role="menuitemradio"` elements with `aria-checked`. Focus moves into the menu with a roving `tabindex` (the focused item `0`, the others `-1`). Arrow keys move focus without selecting, and Enter, Space or a click selects and closes, which matches how a menu reads to screen reader users. Alternative: a disclosure button opening the existing native radio group, rejected because arrowing through native radios selects each one as it goes, so the theme would flash through Light and Dark on the way to System, and closing on change would close the menu on the first arrow press.

**Built in-house as one component.** The switcher keeps its selector and file. State is a signal `open`, plus the index of the focused item; the popup renders with `@if (open())`, so a closed menu is not in the DOM or the accessibility tree. `afterNextRender` focuses the checked item on open. A host `(document:pointerdown)` listener closes the menu when the target is outside the host, and a `(focusout)` listener closes it when focus leaves the host, which covers Tab. Alternative: Angular CDK's menu, rejected because it adds a dependency for one three-item menu. Alternative: the HTML Popover API, rejected because jsdom has no popover support, so unit tests would need stubs like `stubDialogMethods`.

**Position with CSS, anchored to the button.** The host is `relative`; the menu is `absolute right-0 top-full mt-1` with `min-w-40`, `z-20`, `bg-surface text-ink`, a `border-line` border and a shadow, so it opens below the button, right-aligned to it, inside the header's `max-w-7xl` row. Right alignment keeps it on screen when the button is at the right end of the header at any width. Each item is `min-h-11`, with a check mark SVG (`aria-hidden="true"`) shown only when checked and the text label beside it.

**The button shows "Theme" as visible text for now.** A later icon change can put the current theme's icon beside or instead of that text, with "Theme" kept as its accessible name.

## Risks / Trade-offs

- [The `(document:pointerdown)` listener runs on every click anywhere] → it returns at once while `open()` is false.
- [`focusout` fires when focus moves from the button into the menu] → check `relatedTarget` against the host before closing.
- [The menu's surface colors sit next to the dark header in the light theme] → the menu uses the page's surface tokens, and the axe e2e state with the menu open checks contrast in both themes.
- [`e2e/settings.e2e.ts` queries the header's Theme radios] → `polish-settings-dialog` removes that test with the dialog's Theme group; apply this change after it, or update the test here if the order changes.
