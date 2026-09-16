import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { openNewUser } from './support/app';

const detailStatus = (page: Page) => page.locator('app-user-detail-page > p[role="status"]');

/**
 * Records every text the detail screen's status line shows, from the first render of each
 * document, so a notice that flashes and clears is still caught. Call before the first `goto`.
 */
async function recordDetailStatuses(page: Page): Promise<{
  read: () => Promise<string[]>;
  clear: () => Promise<void>;
}> {
  await page.addInitScript(() => {
    const record = window as unknown as { detailStatuses: string[] };
    record.detailStatuses = [];
    new MutationObserver(() => {
      const status = document.querySelector('app-user-detail-page > p[role="status"]');
      const text = status?.textContent?.trim();
      if (text && record.detailStatuses.at(-1) !== text) {
        record.detailStatuses.push(text);
      }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  return {
    read: () =>
      page.evaluate(() => (window as unknown as { detailStatuses: string[] }).detailStatuses),
    clear: () =>
      page.evaluate(() => {
        (window as unknown as { detailStatuses: string[] }).detailStatuses = [];
      }),
  };
}

async function createUser(page: Page): Promise<void> {
  await openNewUser(page);
  await page.getByLabel('Name').fill('Grace Hopper');
  await page.getByLabel('Email').fill('grace@example.com');
  await page.getByRole('button', { name: 'Create user' }).click();
  await expect(page).toHaveURL(/\/users\/u-500000$/);
  await expect(detailStatus(page)).toHaveText('User created.');
}

test.describe('the created notice', () => {
  test('does not come back after a reload', async ({ page }) => {
    const statuses = await recordDetailStatuses(page);
    await createUser(page);

    await page.reload();

    // The in-memory store resets on reload, so the new user is gone.
    await expect(page.getByRole('heading', { level: 1, name: 'User not found' })).toBeVisible();
    await expect(detailStatus(page)).not.toHaveText('User created.');
    expect(await statuses.read()).not.toContain('User created.');
  });

  test('does not come back after Back to users and the browser Back button', async ({ page }) => {
    const statuses = await recordDetailStatuses(page);
    await createUser(page);

    await page.getByRole('link', { name: 'Back to users' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
    await statuses.clear();
    await page.goBack();

    await expect(page.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue('Grace Hopper');
    await expect(detailStatus(page)).not.toHaveText('User created.');
    expect(await statuses.read()).not.toContain('User created.');
  });
});
