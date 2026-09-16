import { Page, expect, test } from '@playwright/test';
import {
  COLOR_SCHEMES,
  VIEWPORTS,
  choosePageSize,
  openAbout,
  openConflictDialog,
  openDetail,
  openList,
  openMissingUser,
  openNewUser,
  menuButton,
  navDrawer,
  showFixedHeader,
  showFilteredList,
  showNavDrawer,
  showNewUserErrors,
  showNoSearchResults,
  showSearchResults,
  showSettingsWcagNote,
  showThemeMenu,
  tableSettingsButton,
  themeButton,
  themeMenu,
} from './support/app';
import {
  applyTextSpacing,
  clippedText,
  obscuredFocusStops,
  scrollsHorizontally,
  smallTargets,
  waitForLoaded,
  zoomTo200Percent,
} from './support/layout';

const SCREENS: { name: string; slug: string; open: (page: Page) => Promise<void> }[] = [
  { name: 'user list', slug: 'list', open: openList },
  { name: 'user list with search results', slug: 'search', open: showSearchResults },
  { name: 'user list with no search results', slug: 'no-results', open: showNoSearchResults },
  { name: 'user list with a filter', slug: 'filter', open: showFilteredList },
  { name: 'user list with a fixed header', slug: 'fixed-header', open: showFixedHeader },
  { name: 'new user with errors', slug: 'new-errors', open: showNewUserErrors },
  { name: 'user detail', slug: 'detail', open: openDetail },
  { name: 'user not found', slug: 'not-found', open: openMissingUser },
  { name: 'conflict dialog', slug: 'dialog', open: openConflictDialog },
  { name: 'about', slug: 'about', open: openAbout },
  { name: 'user list with the Theme menu open', slug: 'theme-menu', open: showThemeMenu },
  { name: 'table settings dialog with WCAG note', slug: 'settings', open: showSettingsWcagNote },
];

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });

// With no stored choice the app follows System, so the emulated OS scheme picks the theme.
for (const colorScheme of COLOR_SCHEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`reflow and target size, ${colorScheme} theme at ${viewport.name}`, () => {
      test.use({ colorScheme, viewport: { width: viewport.width, height: viewport.height } });

      for (const screen of SCREENS) {
        test(screen.name, async ({ page }) => {
          await screen.open(page);
          await shot(page, `${screen.slug}-${viewport.name}-${colorScheme}`);

          expect(await scrollsHorizontally(page)).toBe(false);
          expect(await smallTargets(page)).toEqual([]);
        });
      }
    });
  }

  test.describe(`text spacing (1.4.12), ${colorScheme} theme at 320px`, () => {
    test.use({ colorScheme, viewport: { width: 320, height: 800 } });

    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await screen.open(page);
        await applyTextSpacing(page);
        await waitForLoaded(page);
        await shot(page, `${screen.slug}-text-spacing-${colorScheme}`);

        expect(await clippedText(page)).toEqual([]);
        expect(await scrollsHorizontally(page)).toBe(false);
      });
    }
  });

  test.describe(`200 percent zoom (1.4.4), ${colorScheme} theme at 1280px`, () => {
    test.use({ colorScheme, viewport: { width: 1280, height: 900 } });

    for (const screen of SCREENS) {
      test(screen.name, async ({ page }) => {
        await screen.open(page);
        await zoomTo200Percent(page);
        await waitForLoaded(page);
        await shot(page, `${screen.slug}-zoom-200-${colorScheme}`);

        expect(await clippedText(page)).toEqual([]);
        expect(await scrollsHorizontally(page)).toBe(false);
      });
    }
  });
}

test('new user screen passes at 320px with no errors shown', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openNewUser(page);

  expect(await scrollsHorizontally(page)).toBe(false);
});

test('Table settings sits across from the search field at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openList(page);
  const field = (await page.getByLabel('Search users').boundingBox())!;
  const button = (await tableSettingsButton(page).boundingBox())!;

  // Same row: the button's box overlaps the field's vertically, and starts after it.
  expect(button.y).toBeLessThan(field.y + field.height);
  expect(field.y).toBeLessThan(button.y + button.height);
  expect(button.x).toBeGreaterThan(field.x + field.width);
});

test('Table settings wraps below the search field at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openList(page);
  const field = (await page.getByLabel('Search users').boundingBox())!;
  const button = (await tableSettingsButton(page).boundingBox())!;

  expect(button.y).toBeGreaterThanOrEqual(field.y + field.height);
  expect(await scrollsHorizontally(page)).toBe(false);
});

for (const viewport of VIEWPORTS) {
  test(`the Theme menu opens below its button and stays on screen at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await showThemeMenu(page);
    const button = (await themeButton(page).boundingBox())!;
    const menu = (await themeMenu(page).boundingBox())!;

    expect(menu.y).toBeGreaterThanOrEqual(button.y + button.height);
    expect(menu.x).toBeGreaterThanOrEqual(0);
    expect(menu.x + menu.width).toBeLessThanOrEqual(viewport.width);
    expect(await scrollsHorizontally(page)).toBe(false);
  });
}

// The drawer replaces the entries only below 768px, so it is checked at 320px alone.
for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`nav drawer, ${colorScheme} theme at 320px`, () => {
    test.use({ colorScheme, viewport: { width: 320, height: 800 } });

    test('fits the viewport, keeps its targets and never hides focus', async ({ page }) => {
      await showNavDrawer(page);
      await shot(page, `nav-drawer-320px-${colorScheme}`);
      const drawer = (await navDrawer(page).boundingBox())!;

      expect(drawer.x).toBeGreaterThanOrEqual(0);
      expect(drawer.x + drawer.width).toBeLessThanOrEqual(320);
      expect(await scrollsHorizontally(page)).toBe(false);
      expect(await smallTargets(page)).toEqual([]);
      expect(await obscuredFocusStops(page)).toEqual([]);
    });

    test('keeps its text under WCAG text spacing', async ({ page }) => {
      await showNavDrawer(page);
      await applyTextSpacing(page);
      await waitForLoaded(page);
      await shot(page, `nav-drawer-text-spacing-${colorScheme}`);

      expect(await clippedText(page)).toEqual([]);
      expect(await scrollsHorizontally(page)).toBe(false);
    });
  });
}

test('the header holds the wordmark, Menu and Theme on one row at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openList(page);
  const wordmark = (await page.getByRole('link', { name: 'Orbweaver Admin' }).boundingBox())!;
  const menu = (await menuButton(page).boundingBox())!;
  const theme = (await themeButton(page).boundingBox())!;

  // One row: every box overlaps the wordmark's vertically, and each starts after the one before.
  for (const box of [menu, theme]) {
    expect(box.y).toBeLessThan(wordmark.y + wordmark.height);
    expect(wordmark.y).toBeLessThan(box.y + box.height);
  }
  expect(menu.x).toBeGreaterThanOrEqual(wordmark.x + wordmark.width);
  expect(theme.x).toBeGreaterThanOrEqual(menu.x + menu.width);
  await expect(page.getByRole('link', { name: 'About' })).toBeHidden();
  expect(await scrollsHorizontally(page)).toBe(false);
});

test('the entries stay in the bar with no Menu button at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openList(page);

  await expect(menuButton(page)).toBeHidden();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reports (not available yet)' })).toBeVisible();
});

test('the fixed header list reflows at 320 by 256 px (400 percent zoom)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await showFixedHeader(page);
  await choosePageSize(page, 100);

  expect(await scrollsHorizontally(page)).toBe(false);
  await expect(page.locator('.ag-header')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next Page' })).toBeVisible();
  expect(await clippedText(page)).toEqual([]);
});
