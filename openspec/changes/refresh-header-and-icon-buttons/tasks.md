## 1. Icon buttons

- [x] 1.1 Make Table settings in `users-page.ts` an icon button with hidden text and a `title`, and verify `users-page.spec.ts` still finds a button named "Table settings" with `aria-haspopup="dialog"`
- [x] 1.2 Make Menu in `top-nav.ts` an icon button with hidden text and a `title`, and verify `top-nav.spec.ts` finds a button named "Menu"
- [x] 1.3 Name the Theme button "Theme: " plus the current choice through its hidden text and `title` in `theme-switcher.ts`, and verify `theme-switcher.spec.ts` checks the name for Light, Dark and System and the menu's name "Theme"

## 2. Close buttons

- [x] 2.1 Replace the Table settings dialog's bottom Close with an X icon button beside the heading in `table-settings-dialog.ts`, and verify `table-settings-dialog.spec.ts` finds one button named "Close" and that it is the first Tab stop after the heading
- [x] 2.2 Make the nav drawer's Close an X icon button in `nav-drawer.ts`, and verify `nav-drawer.spec.ts` still closes on Close and returns focus to Menu

## 3. Header

- [x] 3.1 Restore the `header-*` tokens in both themes in `src/styles.css` and use them in `app.ts`, `top-nav.ts` and `theme-switcher.ts`, and verify the header renders dark in both themes
- [x] 3.2 Give `TopNav` a `contents` host, project the right-hand controls after the Primary `nav`, and move Menu after them, and verify `top-nav.spec.ts` and `app.spec.ts` find Menu outside the Primary landmark and the order wordmark, entries, AI assistant, Theme, Menu

## 4. User screens

- [x] 4.1 Add decorative icons to New user, Create user, Save, Cancel, Reset password and "Simulate an edit by another admin", and verify the unit specs still find each by its text name
- [x] 4.2 Show the `aria-hidden` initials avatar beside the detail heading for a loaded user only, and verify `user-detail-page.spec.ts` covers the loaded, not found and failed states

## 5. AI assistant demo

- [x] 5.1 Add `AiChatDrawer` in `src/app/layout/ai-chat-drawer.ts` with its header button, the modal drawer, the fixed conversation, the disabled field and the live example link, and verify its unit spec covers focus on open, Escape, Close and backdrop close, the link's `href`, `target` and hidden new-tab text, and the disabled field's label
- [x] 5.2 Add one sentence about the demo to the About screen's "What it does" section, and verify `about-page.spec.ts` still counts two sentences or fewer

## 6. Docs and checks

- [x] 6.1 Update `README.md` and `docs/accessibility.md` for the icon buttons, the dark header, the avatar, the AI drawer and the Tab order, and mark header pairs not yet re-measured
- [ ] 6.2 Run the browser checks: `npm run test:a11y` with port 4600 free, covering axe on the open AI drawer in both themes at 1280 and 320 CSS pixels, header contrast in both themes, target sizes of the icon buttons, the Table settings dialog's Tab order, and the header's Tab order at both widths, then record the measured header ratios in `docs/accessibility.md`
