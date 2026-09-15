import { Page, test } from '@playwright/test';
import {
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
  showNewUserErrors,
} from './support/app';
import { expectNoAxeViolations } from './support/axe';

const STATES: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'user list', open: openList },
  { name: 'user list load failure (forced through ng.getComponent)', open: forceListFailure },
  { name: 'new user', open: openNewUser },
  { name: 'new user with errors', open: showNewUserErrors },
  { name: 'user detail', open: openDetail },
  { name: 'user not found', open: openMissingUser },
  { name: 'user load failure (forced through ng.getComponent)', open: forceDetailLoadFailure },
  { name: 'user save failure (forced through ng.getComponent)', open: forceSaveFailure },
  { name: 'conflict dialog', open: openConflictDialog },
  { name: 'about', open: openAbout },
];

for (const viewport of VIEWPORTS) {
  test.describe(`axe WCAG A and AA at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const state of STATES) {
      test(state.name, async ({ page }) => {
        await state.open(page);

        await expectNoAxeViolations(page);
      });
    }
  });
}
