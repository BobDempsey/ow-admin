## Context

`App` renders the header with `TopNav` and `ThemeSwitcher` side by side. Before this change `TopNav` held the Menu text button inside `<nav aria-label="Primary">`, so the Theme button came after Menu in Tab order, and the header used the page surface color with a bottom border. The `header-*` tokens were removed in commit c5c1075, but their values are unchanged in git history since `add-theme-switcher`.

`NavDrawer` is a native modal `<dialog>` that slides in from the side, focuses its heading on open, and returns focus to the Menu button on Escape, Close or a backdrop click. The user list already draws an initials circle per row from `user-avatar.ts` (`initialsOf`, `avatarColorIndex`, `AVATAR_COLOR_CLASSES`).

## Goals / Non-Goals

**Goals:**
- Icon-only controls that keep their accessible names, pass 2.5.3 Label in Name through a matching tooltip, and stay 44 by 44 CSS pixels.
- A header whose Tab order matches its visual order.
- A demo drawer that is honest about being a mock and follows the same dialog pattern as the nav drawer.

**Non-Goals:**
- A working chat, an API call, or any AI model in the app.
- Icons on buttons other than the six named in the proposal.
- New color tokens beyond the restored `header-*` set.

## Decisions

**Name icon buttons with hidden text and repeat it in `title`.** Each icon button holds an `aria-hidden` SVG and a `sr-only` span with its name, and a `title` with the same words. The hidden text gives the accessible name; the tooltip gives sighted pointer users the same words, which keeps 2.5.3 satisfied because the visible label, where there is one, is the name. Alternative: `aria-label` alone, rejected because the project already names icon buttons with hidden text (the Theme button) and hidden text is translated with the page.

**Name the Theme button with the current choice.** A computed `buttonName` returns "Theme: " and the chosen option's label, and feeds both the hidden text and `title`. The icon already shows the choice, so the name now says it too, before the menu opens. The menu keeps the name "Theme". Alternative: keep "Theme" and rely on the menu's checked item, rejected because an icon-only button then shows information its name leaves out.

**Project the right-hand controls into `TopNav` and make its host `contents`.** `TopNav` renders the Primary `nav`, then `<ng-content>`, then the Menu button and the drawer, and its host has `display: contents`, so all of them join the header's flex row. `App` projects a `ml-auto` group holding the AI assistant and Theme buttons. Tab order is then wordmark, nav entries, AI assistant, Theme, Menu. Menu sits outside the Primary landmark because it opens a dialog rather than navigating. Alternative: CSS `order` to move Menu, rejected because it would split visual and Tab order (1.3.2, 2.4.3).

**Restore the dark header from the old tokens.** The `header-*` tokens return with their earlier values: slate-900 in light and slate-950 in dark, white text, slate-300 muted text and icons, slate-800 hover, sky-400 focus ring and current-entry underline, and a slate-700 bottom rule in dark only. The report measured these tokens before c5c1075; `e2e/contrast.e2e.ts` re-measures them.

**Put the Table settings Close beside the heading.** The heading and the X button share a flex row at the top of the dialog, so Close is the first Tab stop after the focused heading and a pointer user finds it in the usual corner. The bottom Close is removed so the dialog has one Close. Escape still closes.

**Build the AI drawer like `NavDrawer`.** `AiChatDrawer` renders its own opener and a right-side modal `<dialog>` labelled by its "AI assistant" heading, which takes focus on open. Escape, Close and a backdrop click close it and return focus to the opener. The conversation is a fixed list with hidden "You:" and "Assistant:" prefixes, so a screen reader hears who said each line. The message field is a labelled, `disabled` input whose placeholder says messaging is off. The live example link carries visible text, an external-link icon and hidden "(opens in a new tab)" text, and uses `rel="noopener"`. A "Demo" pill beside the heading marks the drawer as a mock. Alternative: open the external site directly from the header button, rejected because a header button that leaves the app without warning surprises the admin.

**Decorative icons and avatar stay out of the accessibility tree.** Every icon SVG has `aria-hidden="true"`, and the detail avatar is an `aria-hidden` span, since the heading beside it already names the user.

## Risks / Trade-offs

- `title` tooltips do not appear on keyboard focus or touch, so keyboard and touch users see only the icon. The hidden text still names each button for assistive technology. → A custom tooltip could follow later if review asks for one.
- The header contrast values in `docs/accessibility.md` come from before c5c1075. → Task 6.1 re-runs `e2e/contrast.e2e.ts` in both themes and updates the report.
- The demo drawer links to an outside site that this repo does not control. → The link sits in the drawer only, is marked as opening a new tab, and the drawer says it is a demo.
