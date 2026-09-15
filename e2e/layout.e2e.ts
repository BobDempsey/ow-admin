import { Page, expect, test } from '@playwright/test';
import {
  VIEWPORTS,
  openConflictDialog,
  openDetail,
  openList,
  openMissingUser,
  openNewUser,
  showNewUserErrors,
} from './support/app';
import {
  applyTextSpacing,
  clippedText,
  scrollsHorizontally,
  smallTargets,
  waitForLoaded,
  zoomTo200Percent,
} from './support/layout';

const SCREENS: { name: string; slug: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'user list', slug: 'list', open: openList },
  { name: 'new user with errors', slug: 'new-errors', open: showNewUserErrors },
  { name: 'user detail', slug: 'detail', open: openDetail },
  { name: 'user not found', slug: 'not-found', open: openMissingUser },
  { name: 'conflict dialog', slug: 'dialog', open: openConflictDialog },
];

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });

for (const viewport of VIEWPORTS) {
  test.describe(`reflow and target size at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await screen.open(page);
        await shot(page, `${screen.slug}-${viewport.name}`);

        expect(await scrollsHorizontally(page)).toBe(false);
        expect(await smallTargets(page)).toEqual([]);
      });
    }
  });
}

test.describe('text spacing (1.4.12) at 320px', () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const screen of SCREENS) {
    test(screen.name, async ({ page }) => {
      await screen.open(page);
      await applyTextSpacing(page);
      await waitForLoaded(page);
      await shot(page, `${screen.slug}-text-spacing`);

      expect(await clippedText(page)).toEqual([]);
      expect(await scrollsHorizontally(page)).toBe(false);
    });
  }
});

test.describe('200 percent zoom (1.4.4) at 1280px', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const screen of SCREENS) {
    test(screen.name, async ({ page }) => {
      await screen.open(page);
      await zoomTo200Percent(page);
      await waitForLoaded(page);
      await shot(page, `${screen.slug}-zoom-200`);

      expect(await clippedText(page)).toEqual([]);
      expect(await scrollsHorizontally(page)).toBe(false);
    });
  }
});

test('new user screen passes at 320px with no errors shown', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openNewUser(page);

  expect(await scrollsHorizontally(page)).toBe(false);
});
