# UI styling ideas

These are candidate changes for the "improve ui styling to a modern look" task, gathered on 2026-09-16 from current admin and SaaS interfaces (Linear, Vercel, Stripe) and from Tailwind's Catalyst application kit. Nothing here is decided or built yet. Each item that goes ahead gets its own OpenSpec change, and every one still has to pass the WCAG 2.2 suite in `npm run test:a11y`.

## Already in the app

- Comfortable and Compact row density, remembered per browser.
- A Fixed header setting for the user table.
- Sort indicators on every column header.
- Light, dark and system themes driven by color tokens in `@theme`.

## Small visual changes

- **Status and role badges.** Small colored pills in the Status and Role columns. The word stays inside the pill, so meaning never depends on color alone.
- **Initials avatars.** A circle with the user's initials beside each name in the Name column.
- **Page header.** The screen title, a one-line description under it, and the primary action (New user) on the right.
- **Cards for content.** The table and the detail screen's sections sit in `rounded-xl` cards with a light border and a soft shadow. Radius and shadow become tokens.
- **UI typeface.** A clean sans-serif such as Inter or Geist set through a `--font-sans` token, with tabular numbers for counts and paging.

### Decided on 2026-09-16

- Badges in both columns: Status as green, amber and red pills, Role as neutral pills, with the word always inside.
- Initials avatars beside each name, colored from a fixed token set and hidden from screen readers.
- A one-line description under each screen title, with the primary action on the right.
- The table and the detail screen's sections in `rounded-xl` cards with a light border and a soft shadow, through radius and shadow tokens.
- Inter as the UI typeface, self-hosted, with tabular numbers for counts and paging.

## Medium changes

- **Filter toolbar.** Search, Role, Status and Table settings in one bar, with a removable chip for each active filter and a "Clear all" link.
- **Skeleton loading.** Placeholder rows shaped like real rows while a page loads. The visually hidden "Loading users…" message stays for screen readers.
- **Empty states.** A short message and a "Clear filters" button when a search or filter matches nothing, kept separate from an empty data set.
- **Row actions.** An overflow menu on each row with View and Reset password.
- **Detail screen layout.** Two columns, with the form on the left and the Password and Demo sections as side cards, plus a save bar that stays in view.
- **Lighter header.** A surface-colored top bar with a bottom border, as Linear and Vercel use, in place of the dark slate bar.

### Decided on 2026-09-16 (medium)

- A filter toolbar with search, Role and Status, and a removable chip for each active filter plus "Clear all". Table settings stays out of the toolbar, at the table card's top-right, because it changes how the table looks rather than which users show.
- Skeleton rows while a page loads, with the visually hidden "Loading users…" message kept and no shimmer under reduced motion.
- An empty state with a short heading, one line of help and a Clear filters button when a search or filter matches nothing.
- An overflow menu on each row with View and Reset password, following the Theme menu's keyboard pattern and opening the same confirmation dialog.
- A two-column detail screen (the form card on the left, Password and Demo cards on the right, one column below 1024 px) with Save and Cancel in a bar that stays in view while there are unsaved edits.
- A light, surface-colored header with a 1 px bottom border in both themes, keeping the current-screen underline.

## Larger options

- **Sidebar layout.** Catalyst's left navigation, with the existing Menu drawer on narrow screens. The PDF asks for a top navigation bar, so this one is risky.
- **Command palette.** A Cmd+K search across users and actions.
- **Bulk selection.** Row checkboxes with an action bar. This needs new API endpoints.

## Tailwind v4 practices

- Define colors in `oklch` and layer the tokens: raw values, then roles such as `surface` and `primary`, then component tokens.
- Turn any bracket value used more than once into a token.
- Add `prettier-plugin-tailwindcss` so class lists sort the same way everywhere.
- Use container queries where a component should respond to its own width, such as the filter row.
- Keep the `motion-reduce` and `forced-colors` handling, and add `prefers-contrast: more`.
- Keep class names complete in the source so Tailwind can detect them.

## Checks every change needs

Badges, a lighter header, skeleton rows and new card borders each need their contrast measured in both themes and added to the Theme colors table in `docs/accessibility.md`.

## Sources

- [SaaS data table UX patterns (SaaSUI)](https://www.saasui.design/blog/saas-data-table-ux-patterns)
- [7 SaaS UI design trends for 2026 (SaaSUI)](https://www.saasui.design/blog/7-saas-ui-design-trends-2026)
- [SaaS dashboard templates 2026 (AdminLTE)](https://adminlte.io/blog/saas-admin-dashboard-templates/)
- [Admin dashboard guide 2026 (WeWeb)](https://www.weweb.io/blog/admin-dashboard-ultimate-guide-templates-examples)
- [Tailwind CSS best practices for 2026 (Benjamin Crozat)](https://benjamincrozat.com/tailwind-css)
- [Tailwind v4 production guide (tomodahinata)](https://tomodahinata.com/en/blog/tailwind-css-v4-css-first-design-tokens-production-guide)
- [Tailwind v4 design tokens (Mavik Labs)](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
- [Catalyst table docs](https://catalyst.tailwindui.com/docs/table)
- [Catalyst stacked layout](https://catalyst.tailwindui.com/docs/stacked-layout)
- [SaaS table UI examples (SaaSFrame)](https://www.saasframe.io/categories/table)
