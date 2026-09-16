## Context

`TopNav` renders a wordmark link and a `<ul>` of five entries: links for Users and About, and `aria-disabled` buttons for the rest. `App` puts `TopNav` and the theme control in one wrapping `max-w-7xl` header row. Two dialogs in the app already use a native `<dialog>` opened with `showModal()`: `ConflictDialog` and the table settings dialog. `src/testing/dialog.ts` exports `stubDialogMethods()` because jsdom has neither `showModal` nor `close`.

## Goals / Non-Goals

**Goals:**
- One list of entries rendered in two places, so an entry is never added to only one.
- A drawer built from the same `<dialog>` pattern the app already uses and tests.

**Non-Goals:**
- A different set of entries, icons, or nested sections on narrow screens.
- Moving the theme control or the wordmark.
- An animation beyond a simple slide, and no animation at all under `prefers-reduced-motion`.
- A breakpoint the admin can change.

## Decisions

**A native `<dialog>` styled as a left drawer.** `NavDrawer` (`src/app/layout/nav-drawer.ts`) takes the entry list as an input and renders the same `<li>` markup as the bar. `showModal()` gives the focus trap, the backdrop and Escape for free, which a hand-built drawer would have to reproduce. The dialog is `fixed left-0 top-0 h-dvh w-[min(20rem,85vw)] m-0 max-w-none` with `translate-x` for the slide, and its backdrop is the existing `backdrop:bg-backdrop/60`. Escape arrives as `cancel`, which is prevented and routed through the same `close()` as the Close button, as `ConflictDialog` does. A click on the backdrop is a click on the `<dialog>` element itself, so a `(click)` handler closes when `event.target` is the dialog. Alternative: a non-modal `<div>` with a CSS transform, rejected because it needs its own focus trap and inert handling.

**One `NAV_ENTRIES` array, rendered by one component in two places.** `TopNav` keeps the array and an `entry` template fragment, showing the `<ul>` with `hidden md:flex` and the Menu button with `md:hidden`, then passing the same array to `NavDrawer`. Alternative: duplicate markup, rejected because Settings and About were both added once and would have to be added twice again.

**Navigation closes the drawer through the router.** `NavDrawer` subscribes to `NavigationEnd` and closes without restoring focus, since `App` already moves focus to the new screen's `h1`. Closing by Escape, Close or the backdrop restores focus to the Menu button. Alternative: close on the link's click, rejected because a link to the current screen would still close and steal focus back to the button.

**Tailwind's `md` (768 px) is the breakpoint.** The five entries plus the wordmark and the theme control fit on one row above it. The button and drawer live behind `md:hidden` and `hidden md:flex`, so the switch is CSS only and no resize listener is needed.

## Risks / Trade-offs

- [`<dialog>` needs `stubDialogMethods()` in jsdom] → `nav-drawer.spec.ts` calls it, as the other dialog specs do.
- [A 100 dvh drawer on a phone can sit under the browser chrome] → `h-dvh` tracks the visible viewport, and the drawer's content scrolls with `overflow-y-auto`.
- [Playwright helpers that click a nav entry break at 320 px] → add an `openNavDrawer` helper in `e2e/support/app.ts` and use it in the narrow-width tests.
- [Two other queued changes edit the header] → apply this after `polish-settings-dialog` (Settings becomes a placeholder again) and `add-theme-menu` (the theme control becomes one button), so the drawer is built against the final entry list.
