import { Page, expect, test } from '@playwright/test';
import {
  COLOR_SCHEMES,
  VIEWPORTS,
  forceDetailLoadFailure,
  forceListFailure,
  forceSaveFailure,
  openAbout,
  openConflictDialog,
  openDetail,
  openList,
  openMissingUser,
  openNewUser,
  openSettingsDialog,
  showNewUserErrors,
  showFilteredList,
  showNoSearchResults,
  showFixedHeader,
  showSearchResults,
  showSettingsWcagNote,
} from './support/app';
import { expectNoAxeViolations } from './support/axe';

const STATES: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'user list', open: openList },
  { name: 'user list with search results', open: showSearchResults },
  { name: 'user list with no search results', open: showNoSearchResults },
  { name: 'user list with a filter', open: showFilteredList },
  { name: 'user list with a fixed header', open: showFixedHeader },
  { name: 'user list load failure (forced through ng.getComponent)', open: forceListFailure },
  { name: 'new user', open: openNewUser },
  { name: 'new user with errors', open: showNewUserErrors },
  { name: 'user detail', open: openDetail },
  { name: 'user not found', open: openMissingUser },
  { name: 'user load failure (forced through ng.getComponent)', open: forceDetailLoadFailure },
  { name: 'user save failure (forced through ng.getComponent)', open: forceSaveFailure },
  { name: 'conflict dialog', open: openConflictDialog },
  { name: 'about', open: openAbout },
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
