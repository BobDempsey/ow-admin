import { expect, test } from './support/test';
import { openList, statusFilter } from './support/app';

/**
 * A page request settles within the in-memory API's 250 ms latency plus the grid's 50 ms debounce.
 * Waiting longer after leaving gives a settled request its chance to log before the console guard
 * checks.
 */
const SETTLE_MS = 500;

// Leaving mid-load has nothing to do with theme or width, so one setup covers it.
test.use({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });

test.describe('leaving the list mid-load logs nothing', () => {
  test('changing the Status filter and following About at once', async ({ page }) => {
    await openList(page);

    await statusFilter(page).selectOption('suspended');
    await page.getByRole('navigation').getByRole('link', { name: 'About' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'About this app' })).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);
  });

  test('pressing Enter on New user during the first load', async ({ page }) => {
    await page.goto('/users');

    await page.getByRole('link', { name: 'New user' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { level: 1, name: 'New user' })).toBeVisible();
    await page.waitForTimeout(SETTLE_MS);
  });
});
