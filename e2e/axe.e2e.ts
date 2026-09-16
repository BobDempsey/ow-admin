import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  COLOR_SCHEMES,
  VIEWPORTS,
  forceDetailLoadFailure,
  forceListFailure,
  forceResetFailure,
  forceSaveFailure,
  holdListLoad,
  openAbout,
  openConflictDialog,
  openDetail,
  openList,
  openMissingUser,
  openNewUser,
  openResetDialog,
  openSettingsDialog,
  showNewUserErrors,
  showChipsList,
  showFilteredList,
  showListResetDialog,
  showNoSearchResults,
  showFixedHeader,
  showNavDrawer,
  showAiDrawer,
  showResetSent,
  showRowMenu,
  showSearchResults,
  showSettingsWcagNote,
  showThemeMenu,
  showUnsavedEdits,
} from './support/app';
import { expectNoAxeViolations } from './support/axe';

const STATES: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'user list', open: openList },
  { name: 'user list with search results', open: showSearchResults },
  { name: 'user list with no search results', open: showNoSearchResults },
  { name: 'user list with a filter', open: showFilteredList },
  { name: 'user list with a search and two filters', open: showChipsList },
  { name: 'user list while a page loads (held through ng.getComponent)', open: holdListLoad },
  { name: 'user list with the row menu open', open: showRowMenu },
  { name: 'user list with the password reset dialog', open: showListResetDialog },
  { name: 'user list with a fixed header', open: showFixedHeader },
  { name: 'user list load failure (forced through ng.getComponent)', open: forceListFailure },
  { name: 'new user', open: openNewUser },
  { name: 'new user with errors', open: showNewUserErrors },
  { name: 'user detail', open: openDetail },
  { name: 'user detail with unsaved edits', open: showUnsavedEdits },
  { name: 'user not found', open: openMissingUser },
  { name: 'user load failure (forced through ng.getComponent)', open: forceDetailLoadFailure },
  { name: 'user save failure (forced through ng.getComponent)', open: forceSaveFailure },
  { name: 'conflict dialog', open: openConflictDialog },
  { name: 'password reset dialog', open: openResetDialog },
  { name: 'password reset sent', open: showResetSent },
  { name: 'password reset failure (forced through ng.getComponent)', open: forceResetFailure },
  { name: 'about', open: openAbout },
  { name: 'user list with the Theme menu open', open: showThemeMenu },
  { name: 'user list with the AI assistant drawer open', open: showAiDrawer },
  { name: 'table settings dialog', open: openSettingsDialog },
  { name: 'table settings dialog with WCAG note', open: showSettingsWcagNote },
];

// With no stored choice the app follows System, so the emulated OS scheme picks the theme.
for (const colorScheme of COLOR_SCHEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`axe WCAG A and AA, ${colorScheme} theme at ${viewport.name}`, () => {
      test.use({ colorScheme, viewport: { width: viewport.width, height: viewport.height } });

      for (const state of STATES) {
        test(state.name, async ({ page }) => {
          await state.open(page);
          await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

          await expectNoAxeViolations(page);
        });
      }
    });
  }
}

// The Menu button and its drawer exist only below 768px, so that state is checked at 320px alone.
for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`axe WCAG A and AA, ${colorScheme} theme at 320px, nav drawer`, () => {
    test.use({ colorScheme, viewport: { width: 320, height: 800 } });

    test('user list with the nav drawer open', async ({ page }) => {
      await showNavDrawer(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);

      await expectNoAxeViolations(page);
    });
  });
}
