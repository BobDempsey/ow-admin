# Accessibility conformance report

Orbweaver Admin targets WCAG 2.2 level AA. This report lists every level A and AA success criterion, what we found, and how we checked it. It covers the app as of 2026-09-15.

## Scope and setup

The report covers every screen and state in the app: the top navigation and skip link, the user list at `/users` (AG Grid Community 36.1 with pagination), the create screen at `/users/new`, the view and edit screen at `/users/:id` with its loading, not found, load failure and save failure states, the edit conflict dialog, the About screen at `/about`, the Theme control in the header, the Table settings dialog opened from the user list, and sorting and searching the user list. Every screen and state is checked in both the light and the dark theme.

We checked conformance four ways:

- **Browser suite.** `npm run test:a11y` runs Playwright 1.63 with Chromium against the dev server. It runs axe-core 4.13 with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule tags, color contrast included, on 15 states at 1280 and 320 CSS pixels wide, once in the light theme and once in the dark theme (60 runs). It also replays keyboard flows, checks that focus is never fully hidden, measures reflow and target sizes in both themes, and applies WCAG text spacing and 200 percent zoom in both themes. `e2e/theme.e2e.ts` covers the Theme control, `e2e/settings.e2e.ts` the Table settings dialog and the settings it holds, and `e2e/search.e2e.ts` the list search. Test files live in `e2e/`.
- **Unit tests.** `ng test` runs axe in jsdom, color contrast excluded, on each component and state, and tests labels, error association, status messages and focus movement.
- **Manual review.** We reviewed markup, ARIA and design against criteria automation cannot judge, and looked at screenshots taken under text spacing and zoom.
- **Screen reader (partial).** A person ran steps 1 and 2 of the NVDA script at the end of this report with Chrome on Windows. Steps 3 to 21 were not run. The PDF does not require a screen reader pass.

Not covered: Firefox and Safari, mobile screen readers, and Windows forced colors mode (not required at AA). The 200 percent zoom check uses CSS `zoom` on the root element in Chromium, which approximates browser zoom; the manual Ctrl and plus check at 200 percent is step 21 of the NVDA script, which was not run.

### Theme colors

Components use named color tokens defined in `src/styles.css`, each with one light and one dark value. We measured every text, border and focus pair in Chromium from the rendered colors. Text needs 4.5:1; input borders and focus indicators need 3:1.

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
| Header text | 4.5:1 | 17.8:1 | 20.2:1 |
| Header text on hover | 4.5:1 | 14.6:1 | 14.6:1 |
| Placeholder nav entries and Theme label | 4.5:1 | 12.0:1 | 13.6:1 |
| Input borders | 3:1 | 4.8:1 | 6.8:1 |
| Unselected radio and checkbox outlines in table settings | 3:1 | 4.8:1 | 6.8:1 |
| Selected radio and checkbox fill in table settings | 3:1 | 5.9:1 | 3.0:1 |
| Invalid input borders | 3:1 | 6.4:1 | 6.2:1 |
| Focus ring on page | 3:1 | 5.9:1 | 8.2:1 |
| Focus ring on grid header | 3:1 | 5.3:1 | 6.7:1 |
| Focus ring on alert | 3:1 | 5.4:1 | 7.4:1 |
| Focus ring in header | 3:1 | 8.2:1 | 9.3:1 |
| Current nav entry and chosen theme underline | 3:1 | 8.2:1 | 9.3:1 |

Results use three values. **Passes** means the app meets the criterion. **Not applicable** means the app has no content the criterion covers. **Known gap** means the app does not fully meet it; each gap is also listed under "Known gaps".

## Perceivable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Passes | No informative images. AG Grid's paging icons sit in buttons named "First Page", "Previous Page", "Next Page" and "Last Page". axe `image-alt` and `button-name` pass in `e2e/axe.e2e.ts`. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not applicable | No audio or video. |
| 1.2.2 Captions (Prerecorded) | A | Not applicable | No video. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not applicable | No video. |
| 1.2.4 Captions (Live) | AA | Not applicable | No live media. |
| 1.2.5 Audio Description (Prerecorded) | AA | Not applicable | No video. |
| 1.3.1 Info and Relationships | A | Passes | Landmarks (`header`, `nav` named Primary, `main`), one `h1` per screen, a `treegrid` with column headers and `aria-rowcount="500001"` (`e2e/grid.e2e.ts`), `label for` on every form control and `aria-describedby` on errors (`user-form-fields.spec.ts`). The Theme control is a `fieldset` with the legend "Theme" around three native radios (`theme-switcher.spec.ts`). The list search field has a `label for` reading "Search users", and the Role and Status dropdowns beside it are native selects with their own visible `label for` (`users-page.spec.ts`, `e2e/filter.e2e.ts`). |
| 1.3.2 Meaningful Sequence | A | Passes | DOM order matches visual order; AG Grid runs with `ensureDomOrder`. Keyboard flows in `e2e/keyboard.e2e.ts` follow reading order. |
| 1.3.3 Sensory Characteristics | A | Passes | No instruction depends on shape, position or sound. |
| 1.3.4 Orientation | AA | Passes | No orientation lock; layouts reflow at 320 px (`e2e/layout.e2e.ts`). |
| 1.3.5 Identify Input Purpose | AA | Not applicable | The forms collect data about other users, not the admin filling them in, so the criterion's input purposes do not apply. |
| 1.4.1 Use of Color | A | Passes | The current nav entry and the chosen theme are bold and underlined as well as colored. Invalid fields carry a text message and `aria-invalid`. Status is shown as text in the grid. |
| 1.4.2 Audio Control | A | Not applicable | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Passes | axe `color-contrast` passes in every state at both widths in both themes (`e2e/axe.e2e.ts`). With Striped rows on, cell text and links on shaded rows are at least 4.5:1 in both themes (`e2e/settings.e2e.ts`). Every text pair is at least 5.9:1 in light and dark; see "Theme colors" above. |
| 1.4.4 Resize Text | AA | Passes | At 200 percent zoom every screen and the dialog show no clipped text and no page-level sideways scroll (`e2e/layout.e2e.ts`). Grid rows are a fixed height per density, 48 px in Compact (the default) and 64 px in Comfortable, and cell text wraps, because the Infinite Row Model cannot size rows to content. |
| 1.4.5 Images of Text | AA | Not applicable | No images of text. |
| 1.4.10 Reflow | AA | Passes | No page-level sideways scroll at 320 px on any screen or the dialog (`e2e/layout.e2e.ts`). The grid scrolls sideways inside its own box, which the criterion allows for data tables. |
| 1.4.11 Non-text Contrast | AA | Passes | Input borders are 4.8:1 in light and 6.8:1 in dark. Focus rings are at least 5.3:1 in light and 6.7:1 in dark on every background they sit on, and the header's current-entry and chosen-theme underline is 8.2:1 and 9.3:1 (see "Theme colors" above). Secondary buttons have a light border but are identified by their text, which meets 1.4.3. Disabled paging buttons are exempt. |
| 1.4.12 Text Spacing | AA | Passes | With WCAG spacing applied at 320 px no text is clipped on any screen or dialog (`e2e/layout.e2e.ts`), and the list's Compact density keeps two wrapped lines whole (`e2e/grid.e2e.ts`). This failed on the grid before cells wrapped; see `openspec/changes/archive/2026-09-15-verify-wcag-accessibility/audit-findings.md`. |
| 1.4.13 Content on Hover or Focus | AA | Not applicable | No tooltips or content that appears on hover or focus. |

## Operable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 2.1.1 Keyboard | A | Passes | Every task runs from the keyboard: nav, opening a user from the grid with Enter, pagination, create, edit, cancel, simulate, and every conflict choice (`e2e/keyboard.e2e.ts`). The theme is chosen with the arrow keys inside the Theme group (`e2e/theme.e2e.ts`). Tab reaches Search users before the grid, and Enter on a focused column header sorts by it without opening a user (`e2e/keyboard.e2e.ts`). |
| 2.1.2 No Keyboard Trap | A | Passes | Tab leaves the grid in one press. The conflict dialog holds focus while open, as a modal should, and Escape or any button closes it. The Table settings dialog does the same, and Escape or Close closes it (`e2e/settings.e2e.ts`). |
| 2.1.4 Character Key Shortcuts | A | Passes | No single-character shortcuts. |
| 2.2.1 Timing Adjustable | A | Not applicable | No time limits. |
| 2.2.2 Pause, Stop, Hide | A | Not applicable | No moving, blinking or auto-updating content. |
| 2.3.1 Three Flashes or Below Threshold | A | Passes | Nothing flashes. |
| 2.4.1 Bypass Blocks | A | Passes | "Skip to main content" is the first Tab stop and moves focus to `main` without changing the URL (`e2e/keyboard.e2e.ts`). |
| 2.4.2 Page Titled | A | Passes | Titles are "Users", "New user", the user's name, "User not found", or "About", each followed by "Orbweaver Admin" (`e2e/titles.e2e.ts`, `user-detail-page.spec.ts`, `app.routes.spec.ts`). The detail title named only "User" before this audit. |
| 2.4.3 Focus Order | A | Passes | After navigation focus moves to the screen's `h1`; after a failed submit to the first invalid field; after the dialog closes to Save; after Try again to the heading; on opening Table settings to the dialog's heading, and on closing it back to the Table settings button (`e2e/keyboard.e2e.ts`, `e2e/settings.e2e.ts`, unit tests). |
| 2.4.4 Link Purpose (In Context) | A | Passes | Links are "Back to users", "New user", "Users", "About", each user's name, and on the About screen "Go to users" and "Create a user" (`about-page.spec.ts`). |
| 2.4.5 Multiple Ways | AA | Passes | The user list is reached from the nav and the wordmark, and every screen has a direct URL. A user's detail screen is the result of choosing that user from the list, which the criterion exempts. |
| 2.4.6 Headings and Labels | AA | Passes | Headings name each screen or user; form labels are Name, Email, Role and Status; the dialog heading is "This user changed". |
| 2.4.7 Focus Visible | AA | Passes | Every control shows a solid 2 px outline; grid cells and headers show a solid 3 px ring. The Theme radios are visually hidden, so the outline is drawn on the focused radio's label. Rings are sky-700 in light and sky-400 in dark. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Passes | Tabbing through each screen at both widths leaves every focused element at least partly visible (`e2e/keyboard.e2e.ts`). AG Grid moved focus to Page Size without scrolling before this audit; the grid now scrolls focused elements into view. With Fixed header on, arrowing down every row of a 100-row page and back up leaves the focused cell visible below the header, because the grid scrolls it into its own viewport (`e2e/keyboard.e2e.ts`). |
| 2.5.1 Pointer Gestures | A | Passes | No multipoint or path-based gestures. |
| 2.5.2 Pointer Cancellation | A | Passes | Actions fire on click (pointer up). |
| 2.5.3 Label in Name | A | Passes | Accessible names start with the visible text, for example "Reports (not available yet)". |
| 2.5.4 Motion Actuation | A | Not applicable | Nothing responds to device motion. |
| 2.5.7 Dragging Movements | AA | Passes | With default settings grid columns cannot be moved or resized, so no function needs dragging (`e2e/grid.e2e.ts`). Both were drag-only before this audit. Turning on Draggable columns in Table settings makes column reordering drag-only, and turning on Resizable columns leaves dragging as the only single-pointer way to change a width. The dialog names the failure beside each setting, and both are listed under "Known gaps". |
| 2.5.8 Target Size (Minimum) | AA | Passes | Every visible control is at least 24 by 24 px at both widths (`e2e/layout.e2e.ts`); most buttons are 44 px tall. |

## Understandable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 3.1.1 Language of Page | A | Passes | `<html lang="en">`. |
| 3.1.2 Language of Parts | AA | Not applicable | All content is English. |
| 3.2.1 On Focus | A | Passes | Focus never changes context. |
| 3.2.2 On Input | A | Passes | Changing a form field never submits. Choosing a theme changes colors only; focus and the screen stay where they were. Changing Page Size reloads the grid at page one without moving focus or opening anything. |
| 3.2.3 Consistent Navigation | AA | Passes | The skip link and nav are the same on every screen. |
| 3.2.4 Consistent Identification | AA | Passes | "Back to users", Save, Cancel and the status and alert patterns look and read the same wherever they appear. |
| 3.2.6 Consistent Help | A | Not applicable | The app offers no help mechanism. |
| 3.3.1 Error Identification | A | Passes | Invalid fields get `aria-invalid` and a text message tied by `aria-describedby`; save and load failures show `role="alert"` text (`new-user-page.spec.ts`, `user-detail-page.spec.ts`). |
| 3.3.2 Labels or Instructions | A | Passes | Every field has a visible label; error messages say what to enter, for example "Enter an email address like name@example.com." The list search keeps its "Search users" label visible; its placeholder "Name or email" only says what it matches (`e2e/search.e2e.ts`). The Role and Status dropdowns keep their labels visible and open on "Any role" and "Any status", which say what choosing nothing means (`e2e/filter.e2e.ts`). |
| 3.3.3 Error Suggestion | AA | Passes | Messages suggest the fix, and API field errors appear on the matching field. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Passes | Input is checked before it is sent and the admin can correct it; Cancel discards unsaved changes; overwriting another admin's change needs an explicit choice in the conflict dialog. |
| 3.3.7 Redundant Entry | A | Passes | No step asks for information entered earlier. After a conflict, Keep editing and Overwrite keep the admin's values; only Reload, chosen explicitly, discards them. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Not applicable | The app has no sign-in. |

## Robust

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 4.1.2 Name, Role, Value | A | Passes | Native controls (including the Theme radios, whose checked state follows the choice), AG Grid's ARIA roles, column headers whose `aria-sort` follows the sort (`e2e/grid.e2e.ts`), `aria-disabled` placeholders, a Table settings button with `aria-haspopup="dialog"`, a labelled and described conflict `dialog`, a labelled Table settings `dialog` whose 2.5.7 notes are the Draggable columns and Resizable columns checkboxes' descriptions; axe `aria-*`, `button-name`, `label` and `link-name` rules pass in every state (`e2e/axe.e2e.ts`). |
| 4.1.3 Status Messages | AA | Passes | Loading, saving, saved, created and simulated-edit messages use `role="status"`, and so do search and filter results ("N users match", "1 user matches", "No users match"), announced without moving focus from the search field or the Role and Status dropdowns (`e2e/search.e2e.ts`, `e2e/filter.e2e.ts`). The announcement is visually hidden because the total beside the heading already shows the count, while "Loading users…" stays visible; failures use `role="alert"` (unit tests and `e2e/keyboard.e2e.ts`). |

4.1.1 Parsing is obsolete in WCAG 2.2 and not listed.

## Known gaps

With default settings, none of the level A or AA criteria above are known gaps. Four things are still open:

- **2.5.7 Dragging Movements, user list, while Draggable columns is on.** An admin can turn on Draggable columns in Table settings, and columns can then be reordered only by dragging, with no keyboard or single-pointer alternative. The setting is off by default, and the dialog names this failure beside it.

- **2.5.7 Dragging Movements, user list, while Resizable columns is on.** An admin can turn on Resizable columns in Table settings, and a column's width can then be changed by dragging its header edge or with Alt and Left or Right Arrow on a focused header. The keyboard way meets 2.1.1, but the criterion asks for a single-pointer alternative to dragging and there is none. The setting is off by default, and the dialog names this failure beside it.

- The NVDA pass below ran steps 1 and 2 only. Screen reader output for AG Grid and the dialog is checked only through axe and the accessibility tree.
- The checks above ran in Chromium only.

## Decisions a reviewer may question

- **Enter on a grid row opens the user.** A screen reader user may not expect a grid cell to navigate. We kept it because arrow keys still move between cells, the grid is a single Tab stop, and each name cell is also a link named with the user's name. The NVDA pass did not reach this step, so what NVDA announces here is unverified.
- **Column dragging and resizing are settings that fail 2.5.7.** AG Grid Community moves a column only by dragging, and resizes one by dragging a header edge or with Alt and an arrow key on a focused header. Both are off by default, and columns flex to fill the width until one is resized. An admin who wants either can turn on Draggable columns or Resizable columns in Table settings, which says beside each setting that it fails 2.5.7. Single-pointer Move and Width controls were not built.
- **Grid rows have a fixed height.** The Infinite Row Model cannot grow a row to fit wrapped text, so every row leaves room for two lines: 48 px in Compact, the default, and 64 px in Comfortable.
- **Fixed header gives the grid its own scroll area.** With the setting on the grid takes a bounded height, so a wheel over the rows scrolls them before the page. A sticky header was not used, because AG Grid hides the overflow on its root wrappers.

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
| 12 | Tab until Create user, Enter | "Name, edit, invalid entry, Enter a name." | Not run |
| 13 | Type a name, Tab, type an email, Enter | "User created." and the new user's name as heading level 1 | Not run |
| 14 | Tab to Name, add " Jr", Enter | "Saving…" then "User saved." | Not run |
| 15 | Tab to "Simulate an edit by another admin", Enter | "Another admin changed this user. Save to see the conflict." | Not run |
| 16 | Shift and Tab to Save, Enter | "This user changed, dialog", the description, then "Keep editing, button" | Not run |
| 17 | Tab twice | "Reload, button", then "Overwrite, button" | Not run |
| 18 | Escape | Dialog closes; "Save, button" | Not run |
| 19 | Enter, then Tab to Reload, Enter | "Reloaded the latest version of this user." | Not run |
| 20 | Open `/users/u-999999` | "User not found \| Orbweaver Admin" and "User not found, heading level 1" | Not run |
| 21 | Ctrl and plus to 200 percent on `/users` and `/users/u-000042` | No text cut off; nothing needs sideways page scrolling | Not run |
