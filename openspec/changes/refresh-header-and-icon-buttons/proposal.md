## Why

The header and the user screens used text buttons for controls that read faster as icons, the Table settings dialog put Close at the bottom where a keyboard user reaches it last, and the light header from `modernize-ui-styling` blended into the page. The user also wants a way to show what an AI assistant in this app could look like, pointing to a live example on another site.

## What Changes

- The header is dark again in both themes, using the `header-*` color tokens in `src/styles.css`. This reverts the light header from commit c5c1075.
- The header row reads, left to right: the wordmark and the nav entries, then an AI assistant button, the Theme button and, below 768 CSS pixels, the Menu button. The Menu button moves out of the `nav` landmark named Primary.
- Theme, Table settings and Menu become icon-only buttons. Each keeps an accessible name through visually hidden text and shows the same name as a `title` tooltip. Each is 44 by 44 CSS pixels.
- The Theme button's accessible name and tooltip include the current choice: "Theme: Light", "Theme: Dark" or "Theme: System". Its menu stays named "Theme".
- The Table settings dialog and the nav drawer close from an X icon button named "Close" beside their heading. The Table settings dialog loses its Close button at the bottom, so Close is the first Tab stop after the heading.
- New user, Create user, Save, Cancel, Reset password and "Simulate an edit by another admin" show a decorative icon before their text.
- The user detail screen shows the user's initials in a colored circle beside the name heading, matching the list, hidden from assistive technology.
- A new AI assistant button opens a demo drawer from the right: a modal dialog with a fixed sample conversation, a disabled message field, and a "View the live example" link that opens https://ai-storefront.bobdempsey83.com/ in a new tab.

## Capabilities

### New Capabilities

- `ai-assistant-demo`: the header's AI assistant button and the demo drawer it opens.

### Modified Capabilities

- `admin-navigation`: the header's order and colors, and the Menu button as an icon button outside the Primary nav landmark with an icon Close in the drawer.
- `theme-switcher`: the Theme button is icon-only and its name and tooltip include the current choice.
- `settings-dialog`: the Table settings button is icon-only, and the dialog closes from an X button beside its heading instead of a Close button at the bottom.
- `user-management`: the detail screen's initials avatar and the icons on the create and detail screens' buttons.

## Impact

- `src/styles.css`: `header-*` tokens in both themes, and the AI drawer's slide-in transition.
- `src/app/app.ts`: dark header classes, and the AI assistant and Theme buttons projected into `TopNav`.
- `src/app/layout/top-nav.ts`: `host: { class: 'contents' }`, header tokens, and the Menu icon button after the projected controls.
- `src/app/layout/theme-switcher.ts`: header tokens, and a computed name for the hidden text and `title`.
- `src/app/layout/nav-drawer.ts`: the icon Close button.
- `src/app/layout/ai-chat-drawer.ts`: new.
- `src/app/users/users-page.ts`, `table-settings-dialog.ts`, `new-user-page.ts`, `user-detail-page.ts`: icon buttons, the dialog's Close, button icons and the avatar.
- `src/app/about/about-page.ts`: one sentence about the demo.
- Tests: the unit specs for these components, and the e2e files that find Menu, Theme, Close or Table settings by name, or measure header contrast (`e2e/contrast.e2e.ts`).
- Docs: `README.md` and `docs/accessibility.md`.
- No API or store change.
