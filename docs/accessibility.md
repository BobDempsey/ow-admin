# Accessibility conformance report

Orbweaver Admin targets WCAG 2.2 level AA. This report lists every level A and AA success criterion, what we found, and how we checked it. It covers the app as of 2026-09-16.

## Scope and setup

The report covers every screen and state in the app: the top navigation and skip link, the user list at `/users` (AG Grid Community 36.1 with pagination), the create screen at `/users/new`, the view and edit screen at `/users/:id` with its loading, not found, load failure and save failure states, the edit conflict dialog, the Password section with its reset confirmation dialog and its sent and failure states, the drawn caret on every dropdown, the About screen at `/about`, the dark header with its AI assistant, Theme and Menu icon buttons, the Theme menu, the AI assistant demo drawer, the navigation drawer that replaces the nav entries below 768 CSS pixels, the Table settings dialog opened from the user list, sorting and searching the user list, the list's filter chips and Clear all, its placeholder rows while a page loads, its empty state with Clear filters, each row's Actions menu and the password reset sent from it, and the detail screen's two-column layout, initials avatar and save bar. Every screen and state is checked in both the light and the dark theme.

We checked conformance four ways:

- **Browser suite.** `npm run test:a11y` runs Playwright 1.63 with Chromium against the dev server. It runs axe-core 4.13 with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule tags, color contrast included, on 25 states at 1280 and 320 CSS pixels wide, once in the light theme and once in the dark theme, plus the open navigation drawer at 320 px in both themes, since the drawer exists only below 768 px (102 runs). It also replays keyboard flows, checks that focus is never fully hidden, measures reflow and target sizes in both themes, and applies WCAG text spacing and 200 percent zoom in both themes. `e2e/theme.e2e.ts` covers the Theme menu, `e2e/settings.e2e.ts` the Table settings dialog and the settings it holds, `e2e/search.e2e.ts` the list search, `e2e/filter.e2e.ts` the filters, chips and empty state, `e2e/row-actions.e2e.ts` the row Actions menu and the reset sent from it, `e2e/save-bar.e2e.ts` the detail layout and save bar, and `e2e/contrast.e2e.ts` the color pairs. `e2e/layout.e2e.ts` also checks that each dropdown draws its caret clear of its longest option at both widths. Every browser test fails if the page logs a console error or warning or throws an uncaught error, through the `test` fixture in `e2e/support/test.ts`. Test files live in `e2e/`.
- **Unit tests.** `ng test` runs axe in jsdom, color contrast excluded, on each component and state, and tests labels, error association, status messages and focus movement.
- **Manual review.** We reviewed markup, ARIA and design against criteria automation cannot judge, and looked at screenshots taken under text spacing and zoom.
- **Screen reader (partial).** A person ran steps 1 and 2 of the NVDA script at the end of this report with Chrome on Windows. Steps 3 to 21 were not run. The PDF does not require a screen reader pass.

Not covered: Firefox and Safari, mobile screen readers, and Windows forced colors mode (not required at AA). One check emulates forced colors in Chromium and confirms the dropdowns hand their caret back to the browser, which draws it in system colors. The 200 percent zoom check uses CSS `zoom` on the root element in Chromium, which approximates browser zoom; the manual Ctrl and plus check at 200 percent is step 21 of the NVDA script, which was not run.

**Pending browser checks.** The icon-only Theme, Table settings and Menu buttons, the X Close buttons, the button icons, the detail avatar, the restored dark header and the AI assistant drawer landed on 2026-09-16 after the last full browser run. The counts above do not include the open AI assistant drawer. Rows below that name these changes say which checks are still pending; this report claims no browser result for them.

### Theme colors

Components use named color tokens defined in `src/styles.css`, each with one light and one dark value. We measured every text, border and focus pair in Chromium from the rendered colors, except the header pairs noted below. Text needs 4.5:1; input borders and focus indicators need 3:1. Card borders, skeleton bars, pill borders and the card shadow are decorative, so they have no minimum: every card, pill and placeholder is identified by its content. `e2e/contrast.e2e.ts` measures the pill, initials, header and token pairs in both themes and fails below the minimum.

The header is dark again in both themes (slate-900 in light, slate-950 in dark), using the `header-*` tokens it had before commit c5c1075 made it light. The header rows below repeat the ratios this report recorded for those same tokens before that commit. Nobody has re-measured them since the dark header came back, and nobody has ever measured the pair marked "To be re-measured".

| Pair | Needs | Light | Dark |
| --- | --- | --- | --- |
| Body text on page | 4.5:1 | 17.8:1 | 16.3:1 |
| Secondary text on page | 4.5:1 | 10.4:1 | 12.0:1 |
| Status and ID text on page | 4.5:1 | 7.6:1 | 6.8:1 |
| Body text on hover and code backgrounds | 4.5:1 | 16.3:1 | 13.3:1 |
| Links on page | 4.5:1 | 5.9:1 | 10.7:1 |
| Links on hover | 4.5:1 | 9.5:1 | 13.4:1 |
| Primary button text | 4.5:1 | 5.9:1 | 5.9:1 |
| Primary button text on hover | 4.5:1 | 7.5:1 | 7.5:1 |
| Alert text on alert background | 4.5:1 | 7.6:1 | 11.1:1 |
| Alert text on Try again hover | 4.5:1 | 6.9:1 | 6.9:1 |
| Alert text on Try again button | 4.5:1 | 8.4:1 | 12.3:1 |
| Field error text on page | 4.5:1 | 6.4:1 | 6.2:1 |
| Overwrite button text | 4.5:1 | 6.4:1 | 6.4:1 |
| Overwrite button text on hover | 4.5:1 | 8.4:1 | 8.4:1 |
| Header text (`header-ink`, white) on the dark header | 4.5:1 | 17.8:1 | 20.2:1 |
| Header text on its hover fill (`header-hover`, slate-800) | 4.5:1 | 14.6:1 | 14.6:1 |
| Placeholder nav entries (`header-muted`, slate-300) on the dark header | 4.5:1 | 12.0:1 | 13.6:1 |
| Active status pill text on its fill | 4.5:1 | 6.8:1 | 12.4:1 |
| Invited status pill text on its fill | 4.5:1 | 6.8:1 | 12.0:1 |
| Suspended status pill text on its fill | 4.5:1 | 7.6:1 | 11.1:1 |
| Role pill text on its fill, plain and striped rows | 4.5:1 | 9.4:1 | 9.8:1 |
| Initials, avatar color 1 (sky) | 4.5:1 | 6.5:1 | 7.1:1 |
| Initials, avatar color 2 (violet) | 4.5:1 | 7.7:1 | 7.9:1 |
| Initials, avatar color 3 (emerald) | 4.5:1 | 6.7:1 | 7.5:1 |
| Initials, avatar color 4 (amber) | 4.5:1 | 6.4:1 | 7.3:1 |
| Initials, avatar color 5 (rose) | 4.5:1 | 6.6:1 | 6.8:1 |
| Initials, avatar color 6 (slate) | 4.5:1 | 11.9:1 | 8.4:1 |
| Input borders | 3:1 | 4.8:1 | 6.8:1 |
| Dropdown caret stroke on input background | 3:1 | 17.8:1 | 16.3:1 |
| Unselected radio and checkbox outlines in table settings | 3:1 | 4.8:1 | 6.8:1 |
| Selected radio and checkbox fill in table settings | 3:1 | 5.9:1 | 3.0:1 |
| Invalid input borders | 3:1 | 6.4:1 | 6.2:1 |
| Focus ring on page | 3:1 | 5.9:1 | 8.2:1 |
| Focus ring on grid header | 3:1 | 5.3:1 | 6.7:1 |
| Focus ring on alert | 3:1 | 5.4:1 | 7.4:1 |
| Header icons (`header-muted`) on the dark header | 3:1 | 12.0:1 | 13.6:1 |
| Header icons on hover (`header-ink` on `header-hover`) | 3:1 | 14.6:1 | 14.6:1 |
| Icons on page buttons (`ink-muted`: Table settings, Close) | 3:1 | 10.4:1 | 12.0:1 |
| Focus ring in header (`header-focus`, sky-400) | 3:1 | 8.2:1 | 9.3:1 |
| Current nav entry underline (`header-accent`, sky-400) on the header | 3:1 | 8.2:1 | 9.3:1 |
| Current nav entry underline on the header's hover fill | 3:1 | To be re-measured | To be re-measured |
| Card borders (`line-subtle`) on the surface | No minimum | 1.2:1 | 1.7:1 |
| Header bottom rule (`header-line`) | No minimum | None (transparent) | slate-700 on slate-950 |
| Skeleton bars (`skeleton`) on the surface | No minimum | 1.2:1 | 1.7:1 |
| Status pill borders (`status-*-line`) | No minimum | green, amber and red 200 | green, amber and red 800 |
| Card shadow color (`shadow`) | No minimum | slate-900 at 8 percent | black at 50 percent |

Results use three values. **Passes** means the app meets the criterion. **Not applicable** means the app has no content the criterion covers. **Known gap** means the app does not fully meet it; each gap is also listed under "Known gaps".

## Perceivable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Passes | No informative images. AG Grid's paging icons sit in buttons named "First Page", "Previous Page", "Next Page" and "Last Page". axe `image-alt` and `button-name` pass in `e2e/axe.e2e.ts`. The icon-only AI assistant, Theme, Table settings, Menu and Close buttons each hold an `aria-hidden` SVG and visually hidden text that names the button. The icons on New user, Create user, Save, Cancel, Reset password and "Simulate an edit by another admin", the external-link icon on "View the live example", and the initials avatar on the detail screen are decorative and `aria-hidden`. The axe run with the new buttons and the open AI drawer is pending. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not applicable | No audio or video. |
| 1.2.2 Captions (Prerecorded) | A | Not applicable | No video. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not applicable | No video. |
| 1.2.4 Captions (Live) | AA | Not applicable | No live media. |
| 1.2.5 Audio Description (Prerecorded) | AA | Not applicable | No video. |
| 1.3.1 Info and Relationships | A | Passes | Landmarks (`header`, `nav` named Primary, `main`), one `h1` per screen, a `treegrid` with column headers and `aria-rowcount="500001"` (`e2e/grid.e2e.ts`), `label for` on every form control and `aria-describedby` on errors (`user-form-fields.spec.ts`). The Theme control is a button that opens a `menu` named Theme holding three `menuitemradio` items (`theme-switcher.spec.ts`). Below 768 px the nav entries move into a `dialog` named Menu, which lists them as the bar does; both renderings read one `NAV_ENTRIES` array (`nav-drawer.spec.ts`, `top-nav.spec.ts`). The list search field has a `label for` reading "Search users", and the Role and Status dropdowns beside it are native selects with their own visible `label for` (`users-page.spec.ts`, `e2e/filter.e2e.ts`). The list's Search users, Role and Status sit in a `search` landmark named "Filter users", with Table settings outside it; active filter chips are buttons in a list named "Active filters"; the empty state has an `h2`; the detail form sits in a section headed "Details" (`users-page.spec.ts`, `filter-chips.spec.ts`, `user-detail-page.spec.ts`). Initials circles and skeleton bars are `aria-hidden`, so a name is read once and a placeholder row exposes no text (`user-name-cell.spec.ts`, `skeleton-cell.spec.ts`, `e2e/grid.e2e.ts`); the detail screen's initials avatar is `aria-hidden` too, since its heading names the user. The Primary `nav` holds the wordmark and the nav entries; the AI assistant, Theme and Menu buttons sit outside it, in the header. The AI assistant drawer is a `dialog` labelled by its "AI assistant" heading, its sample conversation is an `ol` named "Sample conversation" whose items start with hidden "You:" or "Assistant:" text, and its disabled message field has a `label for` reading "Message". |
| 1.3.2 Meaningful Sequence | A | Passes | DOM order matches visual order; AG Grid runs with `ensureDomOrder`. Keyboard flows in `e2e/keyboard.e2e.ts` follow reading order. The header reads wordmark, nav entries, AI assistant, Theme, then Menu below 768 px, in both DOM and visual order, and the Table settings dialog's Close sits right after its heading in both. The browser checks of these two orders are pending. |
| 1.3.3 Sensory Characteristics | A | Passes | No instruction depends on shape, position or sound. |
| 1.3.4 Orientation | AA | Passes | No orientation lock; layouts reflow at 320 px (`e2e/layout.e2e.ts`). |
| 1.3.5 Identify Input Purpose | AA | Not applicable | The forms collect data about other users, not the admin filling them in, so the criterion's input purposes do not apply. |
| 1.4.1 Use of Color | A | Passes | The current nav entry is bold and underlined as well as colored, and the chosen theme carries a check mark in the Theme menu. Invalid fields carry a text message and `aria-invalid`. Status is shown as a colored pill with the status word inside it, so each status reads without color, and each status has its own fill (`user-pill-cell.spec.ts`, `e2e/contrast.e2e.ts`). Initials circle colors carry no meaning. |
| 1.4.2 Audio Control | A | Not applicable | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Passes | axe `color-contrast` passes in every state at both widths in both themes (`e2e/axe.e2e.ts`). With Striped rows on, cell text and links on shaded rows are at least 4.5:1 in both themes (`e2e/settings.e2e.ts`). Every text pair is at least 5.9:1 in light and dark; see "Theme colors" above. Status and role pills and initials circles are measured against their own fills in both themes, with Striped rows off and on (`e2e/contrast.e2e.ts`). |
| 1.4.4 Resize Text | AA | Passes | At 200 percent zoom every screen and the dialog show no clipped text and no page-level sideways scroll (`e2e/layout.e2e.ts`). Grid rows are a fixed height per density, 48 px in Compact (the default) and 64 px in Comfortable, and cell text wraps, because the Infinite Row Model cannot size rows to content. |
| 1.4.5 Images of Text | AA | Not applicable | No images of text. |
| 1.4.10 Reflow | AA | Passes | No page-level sideways scroll at 320 px on any screen or the dialog (`e2e/layout.e2e.ts`). At 320 px the nav entries move into a drawer, so the header is one row of the wordmark, AI assistant, Theme and a Menu button, and the open drawer fits the viewport (`e2e/layout.e2e.ts`; the check with the AI assistant button in the row, and the reflow check of the open AI drawer, are pending). The grid scrolls sideways inside its own box, which the criterion allows for data tables. The Actions column scrolls with the grid, and a row's Actions menu stays inside the viewport and clear of its button for the last row at 320 px (`e2e/row-actions.e2e.ts`). Below 1024 px the detail screen's Password and Demo cards follow the form in one column (`e2e/save-bar.e2e.ts`). |
| 1.4.11 Non-text Contrast | AA | Passes | Input borders are 4.8:1 in light and 6.8:1 in dark. The app draws each dropdown's caret with the ink color, 17.8:1 in light and 16.3:1 in dark, because a data URI cannot read a color token. Focus rings are at least 5.3:1 in light and 6.7:1 in dark on every background they sit on, and the header's focus ring and current-entry underline are 8.2:1 in light and 9.3:1 in dark on the dark header, from the earlier measurement of the same tokens; the underline on the header's hover fill is still to be re-measured (see "Theme colors" above). Icons that identify an icon-only button are at least 10.4:1 on the page and 12.0:1 on the header. Secondary buttons, the Theme menu, the row Actions menu, filter chips, pills and cards have a light border but are identified by their text or content, which meets 1.4.3; the dark theme's header bottom rule and card borders are decorative. Disabled paging buttons are exempt. |
| 1.4.12 Text Spacing | AA | Passes | With WCAG spacing applied at 320 px no text is clipped on any screen or dialog (`e2e/layout.e2e.ts`), and the list's Compact density keeps two wrapped lines whole (`e2e/grid.e2e.ts`). This failed on the grid before cells wrapped; see `openspec/changes/archive/2026-09-15-verify-wcag-accessibility/audit-findings.md`. Status pills keep their word on one line, and two-line names keep their text beside the initials circle, in Compact rows under text spacing (`e2e/layout.e2e.ts`, `e2e/grid.e2e.ts`). |
| 1.4.13 Content on Hover or Focus | AA | Not applicable | The only tooltips are the native `title` tooltips on icon-only buttons, which the browser controls and the criterion excludes. No other content appears on hover or focus. |

## Operable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 2.1.1 Keyboard | A | Passes | Every task runs from the keyboard: nav, opening a user from the grid with Enter, pagination, create, edit, cancel, simulate, every conflict choice, and a password reset, where Escape in the confirmation sends nothing and Send reset email sends one request (`e2e/keyboard.e2e.ts`). The Theme menu opens with Enter, Space or Down Arrow on its button, moves with the arrow keys, Home and End, chooses with Enter or Space, and closes on Escape or Tab (`e2e/theme.e2e.ts`, `e2e/keyboard.e2e.ts`). Tab reaches Search users before the grid, and Enter on a focused column header sorts by it without opening a user (`e2e/keyboard.e2e.ts`). At 320 px the Menu button opens the drawer with Enter, Tab stays inside it, an entry navigates from the keyboard, and Escape closes it (`e2e/keyboard.e2e.ts`). Filter chips remove their filter with Enter, Clear all and Clear filters work with Enter or Space, and Tab reaches Clear filters in the empty state (`e2e/keyboard.e2e.ts`). A row's Actions button is not a Tab stop, so the grid stays one; arrowing to the Actions cell and pressing Enter or Space opens the menu, which moves with the arrow keys, Home and End, and sends a password reset through its confirmation (`e2e/row-actions.e2e.ts`, `e2e/keyboard.e2e.ts`). The AI assistant button opens its drawer from the keyboard, and Escape or Close closes it; the browser keyboard check is pending. |
| 2.1.2 No Keyboard Trap | A | Passes | Tab leaves the grid in one press. The conflict dialog holds focus while open, as a modal should, and Escape or any button closes it. The password reset confirmation does the same with Escape, Cancel or Send reset email (`e2e/keyboard.e2e.ts`). The Table settings dialog does the same, and Escape or its X Close button closes it (`e2e/settings.e2e.ts`). The AI assistant drawer is a native modal `dialog`, so it holds focus the same way, and Escape, Close or a click outside closes it; the browser check is pending. |
| 2.1.4 Character Key Shortcuts | A | Passes | No single-character shortcuts. |
| 2.2.1 Timing Adjustable | A | Not applicable | No time limits. |
| 2.2.2 Pause, Stop, Hide | A | Passes | The only moving content is the skeleton rows' pulse, which runs only while a page loads, well under 5 seconds with the API's 250 ms latency, and does not run at all when the OS asks for reduced motion (`e2e/grid.e2e.ts`). |
| 2.3.1 Three Flashes or Below Threshold | A | Passes | Nothing flashes. |
| 2.4.1 Bypass Blocks | A | Passes | "Skip to main content" is the first Tab stop and moves focus to `main` without changing the URL (`e2e/keyboard.e2e.ts`). |
| 2.4.2 Page Titled | A | Passes | Titles are "Users", "New user", the user's name, "User not found", or "About", each followed by "Orbweaver Admin" (`e2e/titles.e2e.ts`, `user-detail-page.spec.ts`, `app.routes.spec.ts`). The detail title named only "User" before this audit. |
| 2.4.3 Focus Order | A | Passes | After navigation focus moves to the screen's `h1`; after a failed submit to the first invalid field; after the conflict dialog closes to Save; after Cancel on the user detail screen to the user list's `h1`; after Try again to the heading; the password reset confirmation opens on Cancel, and when it closes, or when Try again follows a failed reset, focus goes to Reset password; on opening Table settings to the dialog's heading, then Tab to its X Close button, and on closing it back to the Table settings button; the Theme menu opens on its checked item and returns focus to the Theme button when it closes; the nav drawer opens on its Menu heading, returns focus to the Menu button on Escape, Close or a click outside, leaves focus to the new screen's `h1` when an entry navigates, returns focus to the Menu button when the entry for the current screen is chosen, and closes with focus on the wordmark when the viewport widens to 768 CSS pixels (`e2e/keyboard.e2e.ts`, `e2e/layout.e2e.ts`, `e2e/settings.e2e.ts`, `e2e/theme.e2e.ts`, `nav-drawer.spec.ts`, `user-detail-page.spec.ts`, and other unit tests). Removing a filter chip moves focus to the chip that took its place, the new last chip, or Search users; Clear all and Clear filters move it to Search users (`users-page.spec.ts`, `e2e/filter.e2e.ts`). A row's Actions menu opens on View; Escape and Tab close it onto the row's Actions cell, and the password reset confirmation opened from it returns focus there, or to the list heading when the row is gone (`row-actions-menu.spec.ts`, `users-page.spec.ts`, `e2e/row-actions.e2e.ts`). On the detail screen the form, Save and Cancel come before the Password and Demo cards at every width (`e2e/save-bar.e2e.ts`). The AI assistant drawer opens on its heading and returns focus to the AI assistant button on Escape, Close or a click outside. After the nav entries, Tab reaches AI assistant, Theme and then Menu; this change moved Menu from before Theme to after it. The browser checks of the new header order, the dialog's Close order and the AI drawer's focus are pending. |
| 2.4.4 Link Purpose (In Context) | A | Passes | Links are "Back to users", "New user", "Users", "About", each user's name, and on the About screen "Go to users" and "Create a user" (`about-page.spec.ts`). The AI assistant drawer's link is named "View the live example (opens in a new tab)". |
| 2.4.5 Multiple Ways | AA | Passes | The user list is reached from the nav and the wordmark, and every screen has a direct URL. A user's detail screen is the result of choosing that user from the list, which the criterion exempts. |
| 2.4.6 Headings and Labels | AA | Passes | Headings name each screen or user; form labels are Name, Email, Role and Status; the detail screen's sections are headed "Password" and "Demo"; the dialog headings are "This user changed", "Reset password?", "Table settings", "Menu" and "AI assistant". |
| 2.4.7 Focus Visible | AA | Passes | Every control shows a solid 2 px outline; grid cells and headers show a solid 3 px ring. Theme menu items and nav drawer entries draw their outline inside their own edge, so it is never clipped by the menu or the drawer. Rings are sky-700 in light and sky-400 in dark on the page, and sky-400 in both themes on the dark header. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Passes | Tabbing through each screen at both widths leaves every focused element at least partly visible (`e2e/keyboard.e2e.ts`). AG Grid moved focus to Page Size without scrolling before this audit; the grid now scrolls focused elements into view. With Fixed header on, arrowing down every row of a 100-row page and back up leaves the focused cell visible below the header, because the grid scrolls it into its own viewport (`e2e/keyboard.e2e.ts`). While the detail screen's save bar is stuck to the bottom of the viewport, scroll padding and a `focusin` handler keep every focused control clear of it at 1280 by 600 and 320 by 568 (`e2e/save-bar.e2e.ts`); below 480 px of height the bar stays in the page flow. |
| 2.5.1 Pointer Gestures | A | Passes | No multipoint or path-based gestures. |
| 2.5.2 Pointer Cancellation | A | Passes | Actions fire on click (pointer up). |
| 2.5.3 Label in Name | A | Passes | Accessible names start with or contain the visible text, for example "Reports (not available yet)", and each filter chip is named "Remove filter" followed by its visible label (`filter-chips.spec.ts`). The row Actions button has no visible text; its name is "Actions for" and the user's name (`user-actions-cell.spec.ts`). The icon-only AI assistant, Theme, Table settings, Menu and Close buttons have no visible text either; each `title` tooltip shows the same words as the button's name, such as "Table settings" or "Theme: Dark", so a speech user can say what the tooltip shows. Buttons that pair an icon with text keep the text as their whole name. |
| 2.5.4 Motion Actuation | A | Not applicable | Nothing responds to device motion. |
| 2.5.7 Dragging Movements | AA | Passes | With default settings grid columns cannot be moved or resized, so no function needs dragging (`e2e/grid.e2e.ts`). Both were drag-only before this audit. Turning on Draggable columns in Table settings makes column reordering drag-only, and turning on Resizable columns leaves dragging as the only single-pointer way to change a width. The dialog names the failure beside each setting, and both are listed under "Known gaps". |
| 2.5.8 Target Size (Minimum) | AA | Passes | Every visible control is at least 24 by 24 px at both widths (`e2e/layout.e2e.ts`); most buttons are 44 px tall. Filter chips and Clear all are 32 px tall, the row Actions button is 32 by 32 px, and row menu items are 44 px tall (`e2e/row-actions.e2e.ts`). The icon-only AI assistant, Theme, Table settings, Menu and Close buttons are 44 by 44 px by their classes; the browser target size check with these buttons is pending. |

## Understandable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 3.1.1 Language of Page | A | Passes | `<html lang="en">`. |
| 3.1.2 Language of Parts | AA | Not applicable | All content is English. |
| 3.2.1 On Focus | A | Passes | Focus never changes context. |
| 3.2.2 On Input | A | Passes | Changing a form field never submits. Choosing a theme changes colors only; the menu closes and focus goes back to the Theme button. Changing Page Size reloads the grid at page one without moving focus or opening anything. |
| 3.2.3 Consistent Navigation | AA | Passes | The skip link, nav and header buttons are the same, in the same order, on every screen. |
| 3.2.4 Consistent Identification | AA | Passes | "Back to users", Save, Cancel and the status and alert patterns look and read the same wherever they appear. The Close button in the Table settings dialog, the nav drawer and the AI assistant drawer uses the same X icon and the name "Close". |
| 3.2.5 Change on Request | AAA | Not required | Level AAA, outside the target. The one link that opens a new tab, "View the live example", says so in its name and shows an external-link icon. |
| 3.2.6 Consistent Help | A | Not applicable | The app offers no help mechanism. |
| 3.3.1 Error Identification | A | Passes | Invalid fields get `aria-invalid` and a text message tied by `aria-describedby`; save and load failures show `role="alert"` text (`new-user-page.spec.ts`, `user-detail-page.spec.ts`). |
| 3.3.2 Labels or Instructions | A | Passes | Every field has a visible label; error messages say what to enter, for example "Enter an email address like name@example.com". Field messages are short phrases with no closing period (`new-user-page.spec.ts`, `user-validation.spec.ts`). The list search keeps its "Search users" label visible; its placeholder "Name or email" only says what it matches (`e2e/search.e2e.ts`). The Role and Status dropdowns keep their labels visible and open on "Any role" and "Any status", which say what choosing nothing means (`e2e/filter.e2e.ts`). |
| 3.3.3 Error Suggestion | AA | Passes | Messages suggest the fix, and API field errors appear on the matching field. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Passes | Input is checked before it is sent and the admin can correct it; Cancel discards unsaved changes; overwriting another admin's change needs an explicit choice in the conflict dialog. A password reset email goes out only after the admin confirms it in a dialog that opens on Cancel. |
| 3.3.7 Redundant Entry | A | Passes | No step asks for information entered earlier. After a conflict, Keep editing and Overwrite keep the admin's values; only Reload, chosen explicitly, discards them. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Not applicable | The app has no sign-in. |

## Robust

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 4.1.2 Name, Role, Value | A | Passes | Native controls, a Theme button with `aria-haspopup="menu"` whose `aria-expanded` follows its menu and `menuitemradio` items whose `aria-checked` follows the choice (`theme-switcher.spec.ts`), AG Grid's ARIA roles, column headers whose `aria-sort` follows the sort (`e2e/grid.e2e.ts`), `aria-disabled` placeholders, a Table settings button and a Menu button, each with `aria-haspopup="dialog"`, a labelled and described conflict `dialog`, a labelled password reset `dialog` described by text naming the user and their email (`reset-password-dialog.spec.ts`), a Reset password button that is never disabled, a nav drawer `dialog` labelled by its Menu heading, an AI assistant button with `aria-haspopup="dialog"` and a drawer `dialog` labelled by its heading, a disabled message field exposed as disabled, a Theme button named for its choice, such as "Theme: System", a labelled Table settings `dialog` whose 2.5.7 notes are the Draggable columns and Resizable columns checkboxes' descriptions; axe `aria-*`, `button-name`, `label` and `link-name` rules pass in every state (`e2e/axe.e2e.ts`). Each row's Actions button has `aria-haspopup="menu"` and an `aria-expanded` that follows its menu, which is a `menu` named for the user with `menuitem` entries (`user-actions-cell.spec.ts`, `row-actions-menu.spec.ts`). |
| 4.1.3 Status Messages | AA | Passes | Loading, saving, saved, created, simulated-edit and password reset messages ("Sending password reset email…", "Password reset email sent.") use `role="status"`, and so do search and filter results ("N users match", "1 user matches", "No users match"), announced without moving focus from the search field or the Role and Status dropdowns (`e2e/search.e2e.ts`, `e2e/filter.e2e.ts`). The announcement is visually hidden because the total beside the heading already shows the count, and "Loading users…" is visually hidden too, since placeholder rows show the load (`users-page.spec.ts`). A reset sent from a row shows "Sending password reset email to {name}…" and "Password reset email sent to {name}." in the same status region, and the detail screen's save bar says "Unsaved changes" once through its own `role="status"` (`e2e/row-actions.e2e.ts`, `e2e/save-bar.e2e.ts`); failures, a failed password reset included, use `role="alert"` (unit tests and `e2e/keyboard.e2e.ts`). |

4.1.1 Parsing is obsolete in WCAG 2.2 and not listed.

## Known gaps

With default settings, none of the level A or AA criteria above are known gaps. Four things are still open:

- **2.5.7 Dragging Movements, user list, while Draggable columns is on.** An admin can turn on Draggable columns in Table settings, and columns can then be reordered only by dragging, with no keyboard or single-pointer alternative. The setting is off by default, and the dialog names this failure beside it.

- **2.5.7 Dragging Movements, user list, while Resizable columns is on.** An admin can turn on Resizable columns in Table settings, and a column's width can then be changed by dragging its header edge or with Alt and Left or Right Arrow on a focused header. The keyboard way meets 2.1.1, but the criterion asks for a single-pointer alternative to dragging and there is none. The setting is off by default, and the dialog names this failure beside it.

- **Browser checks for the 2026-09-16 header and icon changes are pending.** Axe on the open AI drawer, header contrast on the restored dark header, target sizes of the icon buttons, the header's Tab order and the Table settings dialog's Tab order have not run in the browser yet. Until they do, the rows above rest on markup review for these parts.
- The NVDA pass below ran steps 1 and 2 only. Screen reader output for AG Grid and the dialog is checked only through axe and the accessibility tree.
- The checks above ran in Chromium only.

## Decisions a reviewer may question

- **Enter on a grid row opens the user.** A screen reader user may not expect a grid cell to navigate. We kept it because arrow keys still move between cells, the grid is a single Tab stop, and each name cell is also a link named with the user's name. The NVDA pass did not reach this step, so what NVDA announces here is unverified.
- **Column dragging and resizing are settings that fail 2.5.7.** AG Grid Community moves a column only by dragging, and resizes one by dragging a header edge or with Alt and an arrow key on a focused header. Both are off by default, and columns flex to fill the width until one is resized. An admin who wants either can turn on Draggable columns or Resizable columns in Table settings, which says beside each setting that it fails 2.5.7. Single-pointer Move and Width controls were not built.
- **Tab in the row Actions menu returns to the row.** The Theme menu lets Tab move on, but the row menu is drawn after the whole grid, so the next Tab stop after it is outside the list. Tab and Shift+Tab close the menu onto the row's Actions cell instead, and the next Tab leaves the grid as usual.
- **The empty state sits below the grid, not inside it.** AG Grid's overlay turns pointer events off for everything inside it, so a Clear filters button there could not be clicked. The list turns that overlay off and shows the empty state in the table card under the grid, after the paging controls in Tab order.
- **Grid rows have a fixed height.** The Infinite Row Model cannot grow a row to fit wrapped text, so every row leaves room for two lines: 48 px in Compact, the default, and 64 px in Comfortable.
- **Fixed header gives the grid its own scroll area.** With the setting on the grid takes a bounded height, so a wheel over the rows scrolls them before the page. A sticky header was not used, because AG Grid hides the overflow on its root wrappers.
- **The icon buttons use native `title` tooltips.** They do not appear on keyboard focus or touch, so a keyboard or touch user sees only the icon. The hidden text names each button for assistive technology. We did not build a custom tooltip.
- **Menu sits outside the Primary landmark.** It opens a dialog rather than navigating, and it comes after Theme so Tab order matches the row. The drawer it opens is labelled Menu and lists the same entries as the landmark.
- **The AI assistant drawer is a demo.** It shows a fixed conversation, disables its message field, and links to a live example on another site. A "Demo" label beside its heading and the field's placeholder say so, and the disabled field is exempt from 1.4.3.

## NVDA script

Run with NVDA and Chrome on Windows (Narrator works too; note which you used). Start the app with `npm start` and open `http://localhost:4200/users`. Use NVDA's default settings. The Observed column records what was heard, "As expected", or "Not run".

| Step | Keys | Expected announcement | Observed |
| --- | --- | --- | --- |
| 1 | Load `/users` | "Users \| Orbweaver Admin" | As expected |
| 2 | Tab | "Skip to main content, link" | As expected |
| 3 | Enter | "main landmark" | Not run |
| 4 | H | "Users, heading level 1" | Not run |
| 5 | Tab | "New user, link" | Not run |
| 6 | Tab | Grid entered: "Name, column header", with a table or grid of 4 columns | Not run |
| 7 | Down arrow | A user's name, for example "Ada Allen", with row and column position | Not run |
| 8 | Enter | Page changes; "Ada Allen, heading level 1" | Not run |
| 9 | Alt and Left arrow, then Tab to Page Size | "Page Size, combo box, 25" | Not run |
| 10 | Shift and Tab back to Reports in the nav | "Reports (not available yet), button, unavailable" | Not run |
| 11 | Tab to New user, Enter | "New user, heading level 1" | Not run |
| 12 | Tab until Create user, Enter | "Name, edit, invalid entry, Enter a name" | Not run |
| 13 | Type a name, Tab, type an email, Enter | "User created." and the new user's name as heading level 1 | Not run |
| 14 | Tab to Name, add " Jr", Enter | "Saving…" then "User saved." | Not run |
| 15 | Tab to "Simulate an edit by another admin", Enter | "Another admin changed this user. Save to see the conflict." | Not run |
| 16 | Shift and Tab to Save, Enter | "This user changed, dialog", the description, then "Keep editing, button" | Not run |
| 17 | Tab twice | "Reload, button", then "Overwrite, button" | Not run |
| 18 | Escape | Dialog closes; "Save, button" | Not run |
| 19 | Enter, then Tab to Reload, Enter | "Reloaded the latest version of this user." | Not run |
| 20 | Open `/users/u-999999` | "User not found \| Orbweaver Admin" and "User not found, heading level 1" | Not run |
| 21 | Ctrl and plus to 200 percent on `/users` and `/users/u-000042` | No text cut off; nothing needs sideways page scrolling | Not run |
