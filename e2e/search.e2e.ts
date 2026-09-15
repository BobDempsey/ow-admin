import { Page, expect, test } from '@playwright/test';
import { listStatus, openList, recordListRequests } from './support/app';

const searchField = (page: Page) => page.getByLabel('Search users');
const total = (page: Page) => page.locator('app-users-page h1 + p');
const rowTexts = (page: Page) =>
  page
    .locator('.ag-row:has(a)')
    .evaluateAll((rows) => rows.map((row) => row.textContent?.toLowerCase() ?? ''));

test.describe('user list search', () => {
  test('has a visible label and a Name or email placeholder', async ({ page }) => {
    await openList(page);

    await expect(page.getByText('Search users', { exact: true })).toBeVisible();
    await expect(searchField(page)).toHaveAttribute('placeholder', 'Name or email');
  });

  test('typing sends one request from the first page and shows only matches', async ({ page }) => {
    await openList(page);
    const requests = await recordListRequests(page);

    await searchField(page).pressSequentially('hopper', { delay: 40 });

    await expect(listStatus(page)).toContainText(/users match/);
    expect(await requests()).toEqual([{ skip: 0, limit: 25, q: 'hopper' }]);
    await expect(total(page)).toContainText(/users match/);
    await expect(searchField(page)).toBeFocused();
    const rows = await rowTexts(page);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toContain('hopper');
    }
  });

  test('clearing the search shows every user again', async ({ page }) => {
    await openList(page);
    await searchField(page).fill('lamport');
    await expect(listStatus(page)).toContainText(/users match/);
    const requests = await recordListRequests(page);

    await searchField(page).fill('');

    await expect(listStatus(page)).toHaveText('500,000 users');
    await expect(total(page)).toHaveText('500,000 users');
    expect(await requests()).toEqual([{ skip: 0, limit: 25 }]);
  });

  test('says when no user matches', async ({ page }) => {
    await openList(page);

    await searchField(page).fill('no-such-user-xyz');

    await expect(listStatus(page)).toHaveText('No users match');
    await expect(total(page)).toHaveText('0 users match');
    await expect(page.getByText('No users match your search.')).toBeVisible();
  });

  test('keeps the current sort', async ({ page }) => {
    await openList(page);
    const email = page.getByRole('columnheader', { name: 'Email' });
    await email.click();
    await email.click();
    await expect(email).toHaveAttribute('aria-sort', 'descending');
    const requests = await recordListRequests(page);

    await searchField(page).fill('turing');

    await expect(listStatus(page)).toContainText(/users match/);
    expect((await requests()).at(-1)).toEqual({
      skip: 0,
      limit: 25,
      q: 'turing',
      sort: { field: 'email', direction: 'desc' },
    });
    await expect(email).toHaveAttribute('aria-sort', 'descending');
  });

  test('finds a user created in this session', async ({ page }) => {
    await page.goto('/users/new');
    await page.getByLabel('Name').fill('Zelda Quartermaine');
    await page.getByLabel('Email').fill('zelda@example.com');
    await page.getByRole('button', { name: 'Create user' }).click();
    await expect(page.getByRole('status')).toContainText('User created.');
    await page.getByRole('link', { name: 'Back to users' }).click();
    await page.locator('.ag-row a').first().waitFor();

    await searchField(page).fill('quartermaine');

    await expect(total(page)).toHaveText('1 user matches');
    await expect(listStatus(page)).toHaveText('1 user matches');
    await expect(page.locator('.ag-row a')).toHaveText(['Zelda Quartermaine']);
  });

  test('shows the match count beside the heading and hides the announcement', async ({ page }) => {
    await openList(page);

    await searchField(page).fill('lamport');

    await expect(listStatus(page)).toContainText(/users match/);
    await expect(total(page)).toContainText(/users match/);
    const announcement = listStatus(page).locator('span');
    expect(await announcement.evaluate((span) => getComputedStyle(span).clipPath)).toBe(
      'inset(50%)',
    );
  });
});
