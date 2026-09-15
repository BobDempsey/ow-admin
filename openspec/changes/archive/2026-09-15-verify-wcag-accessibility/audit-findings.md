# Audit findings

Recorded on 2026-09-15 from `npm run test:a11y` (Chromium 1243 through `@playwright/test` 1.63.0, dev server on port 4600), before any fix in group 3.

## App failures

1. **Columns move by dragging (2.5.7).** Dragging the Email header onto Name reorders the columns to Email, Name, Role, Status. AG Grid Community offers no non-drag way to move a column. Test: `grid.e2e.ts` "columns cannot be reordered by dragging a header".
2. **Columns resize by dragging (2.5.7).** Dragging the right edge of the Role header 120 px widened it from 120 px to 242 px. Test: `grid.e2e.ts` "columns cannot be resized by dragging a header edge".
3. **Focus lands off-screen on Page Size (2.4.11).** From the grid header, Tab moves focus to AG Grid's Page Size combobox without scrolling it into view: at 1280 by 800 it sat at top 1331 px with the page still at scrollY 0, and at 320 by 800 at top 1423 px. The next Tab, to First Page, does scroll. Test: `keyboard.e2e.ts` "focus is never fully hidden" on the user list, both widths.
4. **Grid cells cut text off with an ellipsis (1.4.12, 1.4.4).** With WCAG text spacing at 320 px, 17 of 25 email cells and several name cells ("Barbara Berners-…", "Katherine Lampo…") are truncated. At 200 percent zoom at 1280 px, `barbara.berners-lee.2@example.com` is truncated. The full values exist only on each user's detail screen. Tests: `layout.e2e.ts` "text spacing" and "200 percent zoom" on the user list. AG Grid's row height docs state that variable row height (`autoHeight`, `wrapText`, `getRowHeight`) cannot be used with the Infinite Row Model, so rows cannot grow to fit wrapped text.
5. **Detail screen title does not name the user (2.4.2).** Found in the design review, not by the suite: `/users/:id` keeps the route title `User | Orbweaver Admin` for every user.

## Passed

- axe with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`, color contrast included: no violations in any of the 9 states at 1280 px or 320 px (18 scans).
- Keyboard flows: skip link, nav with placeholders announced as unavailable, grid as one tab stop with Enter on a row opening the user, Tab from the grid to the pagination controls, create with errors then success, edit save and cancel, and the conflict dialog (focus stays in the dialog, Escape keeps edits, Reload and Overwrite).
- Focus never fully hidden on the new user, detail and not found screens at both widths.
- Reflow and 24 px targets on every screen and the dialog at both widths.
- Text spacing and 200 percent zoom on every screen except the user list.
- The grid exposes `treegrid` with `aria-rowcount="500001"` and column headers Name, Email, Role and Status.

## Test mistakes corrected during the audit

These failed first and were fixes to the tests or helpers, not to the app:

- `openList` waited for AG Grid's placeholder rows instead of loaded data, so Enter on a row and the screenshots ran against an empty page. It now waits for a name link.
- The nav test pressed Tab twice from Users and expected Reports, which is one Tab away.
- The Overwrite heading check did not allow for whitespace around the heading text.
- The target-size and clipped-text helpers counted visually hidden text (the skip link before focus, the "(not available yet)" spans and AG Grid's live description) and text inside scroll containers.
- Style injection made the grid reload, so text spacing and zoom checks now wait for the loading message to clear.
