# Accessibility conformance report

Orbweaver Admin targets WCAG 2.2 level AA. This report lists every level A and AA success criterion, what we found, and how we checked it. It covers the app as of 2026-09-15.

## Scope and setup

The report covers every screen and state in the app: the top navigation and skip link, the user list at `/users` (AG Grid Community 36.1 with pagination), the create screen at `/users/new`, the view and edit screen at `/users/:id` with its loading, not found, load failure and save failure states, the edit conflict dialog, and the About screen at `/about`.

We checked conformance four ways:

- **Browser suite.** `npm run test:a11y` runs Playwright 1.63 with Chromium against the dev server. It runs axe-core 4.13 with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule tags, color contrast included, on 10 states at 1280 and 320 CSS pixels wide. It also replays keyboard flows, checks that focus is never fully hidden, measures reflow and target sizes, and applies WCAG text spacing and 200 percent zoom. Test files live in `e2e/`.
- **Unit tests.** `ng test` runs axe in jsdom, color contrast excluded, on each component and state, and tests labels, error association, status messages and focus movement.
- **Manual review.** We reviewed markup, ARIA and design against criteria automation cannot judge, and looked at screenshots taken under text spacing and zoom.
- **Screen reader (partial).** A person ran steps 1 and 2 of the NVDA script at the end of this report with Chrome on Windows. Steps 3 to 21 were not run. The PDF does not require a screen reader pass.

Not covered: Firefox and Safari, mobile screen readers, and Windows forced colors mode (not required at AA). The 200 percent zoom check uses CSS `zoom` on the root element in Chromium, which approximates browser zoom; the manual Ctrl and plus check at 200 percent is step 21 of the NVDA script, which was not run.

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
| 1.3.1 Info and Relationships | A | Passes | Landmarks (`header`, `nav` named Primary, `main`), one `h1` per screen, a `treegrid` with column headers and `aria-rowcount="500001"` (`e2e/grid.e2e.ts`), `label for` on every form control and `aria-describedby` on errors (`user-form-fields.spec.ts`). |
| 1.3.2 Meaningful Sequence | A | Passes | DOM order matches visual order; AG Grid runs with `ensureDomOrder`. Keyboard flows in `e2e/keyboard.e2e.ts` follow reading order. |
| 1.3.3 Sensory Characteristics | A | Passes | No instruction depends on shape, position or sound. |
| 1.3.4 Orientation | AA | Passes | No orientation lock; layouts reflow at 320 px (`e2e/layout.e2e.ts`). |
| 1.3.5 Identify Input Purpose | AA | Not applicable | The forms collect data about other users, not the admin filling them in, so the criterion's input purposes do not apply. |
| 1.4.1 Use of Color | A | Passes | The current nav entry is bold and underlined as well as colored. Invalid fields carry a text message and `aria-invalid`. Status is shown as text in the grid. |
| 1.4.2 Audio Control | A | Not applicable | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Passes | axe `color-contrast` passes in every state at both widths (`e2e/axe.e2e.ts`). Measured by hand on the header: white 17.8:1, slate-300 placeholders 12:1. |
| 1.4.4 Resize Text | AA | Passes | At 200 percent zoom every screen and the dialog show no clipped text and no page-level sideways scroll (`e2e/layout.e2e.ts`). Grid rows are 64 px and cell text wraps, because the Infinite Row Model cannot size rows to content. |
| 1.4.5 Images of Text | AA | Not applicable | No images of text. |
| 1.4.10 Reflow | AA | Passes | No page-level sideways scroll at 320 px on any screen or the dialog (`e2e/layout.e2e.ts`). The grid scrolls sideways inside its own box, which the criterion allows for data tables. |
| 1.4.11 Non-text Contrast | AA | Passes | Input borders (slate-500) are 4.8:1 on white. Focus rings are sky-700 on white (5.9:1) and sky-400 on the slate-900 header (8.2:1). Secondary buttons have a light border but are identified by their text, which meets 1.4.3. Disabled paging buttons are exempt. |
| 1.4.12 Text Spacing | AA | Passes | With WCAG spacing applied at 320 px no text is clipped on any screen or the dialog (`e2e/layout.e2e.ts`). This failed on the grid before cells wrapped; see `openspec/changes/archive/2026-09-15-verify-wcag-accessibility/audit-findings.md`. |
| 1.4.13 Content on Hover or Focus | AA | Not applicable | No tooltips or content that appears on hover or focus. |

## Operable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 2.1.1 Keyboard | A | Passes | Every task runs from the keyboard: nav, opening a user from the grid with Enter, pagination, create, edit, cancel, simulate, and every conflict choice (`e2e/keyboard.e2e.ts`). |
| 2.1.2 No Keyboard Trap | A | Passes | Tab leaves the grid in one press. The conflict dialog holds focus while open, as a modal should, and Escape or any button closes it. |
| 2.1.4 Character Key Shortcuts | A | Passes | No single-character shortcuts. |
| 2.2.1 Timing Adjustable | A | Not applicable | No time limits. |
| 2.2.2 Pause, Stop, Hide | A | Not applicable | No moving, blinking or auto-updating content. |
| 2.3.1 Three Flashes or Below Threshold | A | Passes | Nothing flashes. |
| 2.4.1 Bypass Blocks | A | Passes | "Skip to main content" is the first Tab stop and moves focus to `main` without changing the URL (`e2e/keyboard.e2e.ts`). |
| 2.4.2 Page Titled | A | Passes | Titles are "Users", "New user", the user's name, "User not found", or "About", each followed by "Orbweaver Admin" (`e2e/titles.e2e.ts`, `user-detail-page.spec.ts`, `app.routes.spec.ts`). The detail title named only "User" before this audit. |
| 2.4.3 Focus Order | A | Passes | After navigation focus moves to the screen's `h1`; after a failed submit to the first invalid field; after the dialog closes to Save; after Try again to the heading (`e2e/keyboard.e2e.ts`, unit tests). |
| 2.4.4 Link Purpose (In Context) | A | Passes | Links are "Back to users", "New user", "Users", "About", each user's name, and on the About screen "Go to users" and "Create a user" (`about-page.spec.ts`). |
| 2.4.5 Multiple Ways | AA | Passes | The user list is reached from the nav and the wordmark, and every screen has a direct URL. A user's detail screen is the result of choosing that user from the list, which the criterion exempts. |
| 2.4.6 Headings and Labels | AA | Passes | Headings name each screen or user; form labels are Name, Email, Role and Status; the dialog heading is "This user changed". |
| 2.4.7 Focus Visible | AA | Passes | Every control shows a solid 2 px outline; grid cells and headers show a solid 3 px sky-700 ring. |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Passes | Tabbing through each screen at both widths leaves every focused element at least partly visible (`e2e/keyboard.e2e.ts`). AG Grid moved focus to Page Size without scrolling before this audit; the grid now scrolls focused elements into view. |
| 2.5.1 Pointer Gestures | A | Passes | No multipoint or path-based gestures. |
| 2.5.2 Pointer Cancellation | A | Passes | Actions fire on click (pointer up). |
| 2.5.3 Label in Name | A | Passes | Accessible names start with the visible text, for example "Reports (not available yet)". |
| 2.5.4 Motion Actuation | A | Not applicable | Nothing responds to device motion. |
| 2.5.7 Dragging Movements | AA | Passes | Grid columns cannot be moved or resized, so no function needs dragging (`e2e/grid.e2e.ts`). Both were drag-only before this audit. |
| 2.5.8 Target Size (Minimum) | AA | Passes | Every visible control is at least 24 by 24 px at both widths (`e2e/layout.e2e.ts`); most buttons are 44 px tall. |

## Understandable

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 3.1.1 Language of Page | A | Passes | `<html lang="en">`. |
| 3.1.2 Language of Parts | AA | Not applicable | All content is English. |
| 3.2.1 On Focus | A | Passes | Focus never changes context. |
| 3.2.2 On Input | A | Passes | Changing a form field never submits. Changing Page Size reloads the grid at page one without moving focus or opening anything. |
| 3.2.3 Consistent Navigation | AA | Passes | The skip link and nav are the same on every screen. |
| 3.2.4 Consistent Identification | AA | Passes | "Back to users", Save, Cancel and the status and alert patterns look and read the same wherever they appear. |
| 3.2.6 Consistent Help | A | Not applicable | The app offers no help mechanism. |
| 3.3.1 Error Identification | A | Passes | Invalid fields get `aria-invalid` and a text message tied by `aria-describedby`; save and load failures show `role="alert"` text (`new-user-page.spec.ts`, `user-detail-page.spec.ts`). |
| 3.3.2 Labels or Instructions | A | Passes | Every field has a visible label; error messages say what to enter, for example "Enter an email address like name@example.com." |
| 3.3.3 Error Suggestion | AA | Passes | Messages suggest the fix, and API field errors appear on the matching field. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Passes | Input is checked before it is sent and the admin can correct it; Cancel discards unsaved changes; overwriting another admin's change needs an explicit choice in the conflict dialog. |
| 3.3.7 Redundant Entry | A | Passes | No step asks for information entered earlier. After a conflict, Keep editing and Overwrite keep the admin's values; only Reload, chosen explicitly, discards them. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Not applicable | The app has no sign-in. |

## Robust

| Criterion | Level | Result | Evidence |
| --- | --- | --- | --- |
| 4.1.2 Name, Role, Value | A | Passes | Native controls, AG Grid's ARIA roles, `aria-disabled` placeholders and a labelled and described `dialog`; axe `aria-*`, `button-name`, `label` and `link-name` rules pass in every state (`e2e/axe.e2e.ts`). |
| 4.1.3 Status Messages | AA | Passes | Loading, saving, saved, created and simulated-edit messages use `role="status"`; failures use `role="alert"` (unit tests and `e2e/keyboard.e2e.ts`). |

4.1.1 Parsing is obsolete in WCAG 2.2 and not listed.

## Known gaps

None of the level A or AA criteria above are known gaps. Two things are still open:

- The NVDA pass below ran steps 1 and 2 only. Screen reader output for AG Grid and the dialog is checked only through axe and the accessibility tree.
- The checks above ran in Chromium only.

## Decisions a reviewer may question

- **Enter on a grid row opens the user.** A screen reader user may not expect a grid cell to navigate. We kept it because arrow keys still move between cells, the grid is a single Tab stop, and each name cell is also a link named with the user's name. The NVDA pass did not reach this step, so what NVDA announces here is unverified.
- **Columns cannot be moved or resized.** AG Grid Community only offers dragging for both, and the list does not need either; columns flex to fill the width.
- **Grid rows are 64 px tall.** The Infinite Row Model cannot grow a row to fit wrapped text, so every row leaves room for two lines.

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
