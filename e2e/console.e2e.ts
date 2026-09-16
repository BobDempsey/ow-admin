import { expect, test } from './support/test';
import {
  clearAllButton,
  filterChip,
  listStatus,
  openList,
  showChipsList,
  showNoSearchResults,
  statusFilter,
} from './support/app';

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

test.describe('operating the list logs nothing', () => {
  test('removing a filter chip, then Clear all', async ({ page }) => {
    await showChipsList(page);

    await filterChip(page, 'Role: Admin').click();
    await expect(filterChip(page, 'Status: active')).toBeFocused();
    await expect(listStatus(page)).toContainText(/match/);
    await clearAllButton(page).click();

    await expect(page.getByRole('list', { name: 'Active filters' })).toBeHidden();
    await expect(listStatus(page)).toHaveText('500,000 users');
    await page.waitForTimeout(SETTLE_MS);
  });

  test('Clear filters in the empty state', async ({ page }) => {
    await showNoSearchResults(page);

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(listStatus(page)).toHaveText('500,000 users');
    await page.locator('.ag-row a').first().waitFor();
    await page.waitForTimeout(SETTLE_MS);
  });
});
