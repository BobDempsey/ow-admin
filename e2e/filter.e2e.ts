import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  clearAllButton,
  filterChip,
  listStatus,
  openList,
  recordListRequests,
  roleFilter,
  searchList,
  statusFilter,
} from './support/app';

const searchField = (page: Page) => page.getByLabel('Search users');
const total = (page: Page) => page.locator('app-users-page h1 + p');
const rowTexts = (page: Page) =>
  page
    .locator('.ag-row:has(a)')
    .evaluateAll((rows) => rows.map((row) => row.textContent?.toLowerCase() ?? ''));

test.describe('user list filters', () => {
  test('both dropdowns are labelled and start on their Any option', async ({ page }) => {
    await openList(page);

    await expect(roleFilter(page)).toHaveValue('');
    await expect(statusFilter(page)).toHaveValue('');
    await expect(roleFilter(page).locator('option').first()).toHaveText('Any role');
    await expect(statusFilter(page).locator('option').first()).toHaveText('Any status');
  });

  test('choosing a status filters from the first page and shows only those rows', async ({
    page,
  }) => {
    await openList(page);
    await page.getByRole('button', { name: 'Next Page' }).click();
    await expect(page.getByRole('spinbutton', { name: /Page number/ })).toHaveValue('2');
    const requests = await recordListRequests(page);

    await statusFilter(page).selectOption('suspended');

    await expect(listStatus(page)).toContainText(/users match/);
    expect(await requests()).toEqual([{ skip: 0, limit: 25, status: 'suspended' }]);
    await expect(page.getByRole('spinbutton', { name: /Page number/ })).toHaveValue('1');
    const rows = await rowTexts(page);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toContain('suspended');
    }
  });

  test('a filter combines with the search', async ({ page }) => {
    await openList(page);
    await searchField(page).fill('hopper');
    await expect(listStatus(page)).toContainText(/users match/);
    const requests = await recordListRequests(page);

    await roleFilter(page).selectOption('Admin');

    // Both loads say "users match", so wait on the request rather than on the status text.
    await expect
      .poll(async () => (await requests()).at(-1))
      .toEqual({
        skip: 0,
        limit: 25,
        q: 'hopper',
        role: 'Admin',
      });
    await expect(listStatus(page)).not.toContainText('Loading');
    for (const row of await rowTexts(page)) {
      expect(row).toContain('hopper');
      expect(row).toContain('admin');
    }
  });

  test('a filter keeps the current sort', async ({ page }) => {
    await openList(page);
    const email = page.getByRole('columnheader', { name: 'Email' });
    await email.click();
    await email.click();
    await expect(email).toHaveAttribute('aria-sort', 'descending');
    const requests = await recordListRequests(page);

    await roleFilter(page).selectOption('Viewer');

    await expect(listStatus(page)).toContainText(/users match/);
    await expect
      .poll(async () => (await requests()).at(-1))
      .toEqual({
        skip: 0,
        limit: 25,
        role: 'Viewer',
        sort: { field: 'email', direction: 'desc' },
      });
    await expect(email).toHaveAttribute('aria-sort', 'descending');
  });

  test('choosing Any role shows every user again', async ({ page }) => {
    await openList(page);
    await roleFilter(page).selectOption('Admin');
    await expect(listStatus(page)).toContainText(/users match/);
    const requests = await recordListRequests(page);

    await roleFilter(page).selectOption('');

    await expect(listStatus(page)).toHaveText('500,000 users');
    await expect(total(page)).toHaveText('500,000 users');
    expect(await requests()).toEqual([{ skip: 0, limit: 25 }]);
  });

  test('says when no user matches the search and filters', async ({ page }) => {
    await openList(page);
    await roleFilter(page).selectOption('Admin');
    await expect(total(page)).toHaveText('25,000 users match');

    await searchField(page).fill('no-such-user-xyz');

    await expect(total(page)).toHaveText('0 users match');
    await expect(listStatus(page)).toHaveText('No users match');
    await expect(page.getByRole('heading', { level: 2, name: 'No users match' })).toBeVisible();
    await expect(
      page.getByText('Try a different search or filter, or clear them to see every user.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
  });

  test('announces the match count without taking focus off the dropdown', async ({ page }) => {
    await openList(page);

    // Playwright's selectOption does not focus the control, so focus starts where a user's would.
    await statusFilter(page).focus();
    await statusFilter(page).selectOption('invited');

    await expect(listStatus(page)).toContainText(/users match/);
    await expect(total(page)).toContainText(/users match/);
    await expect(statusFilter(page)).toBeFocused();
  });
});

test.describe('user list filter chips', () => {
  test('shows a chip for each active filter, then Clear all', async ({ page }) => {
    await openList(page);
    await expect(clearAllButton(page)).toBeHidden();

    await searchField(page).fill('hopper');
    await roleFilter(page).selectOption('Admin');

    await expect(page.getByRole('list', { name: 'Active filters' }).getByRole('button')).toHaveText(
      [/Search: hopper/, /Role: Admin/],
    );
    await expect(filterChip(page, 'Search: hopper')).toBeVisible();
    await expect(filterChip(page, 'Role: Admin')).toBeVisible();
    await expect(clearAllButton(page)).toBeVisible();
  });

  test('removing a chip drops that filter from the first page and moves focus', async ({
    page,
  }) => {
    await openList(page);
    await roleFilter(page).selectOption('Admin');
    await statusFilter(page).selectOption('suspended');
    await expect(filterChip(page, 'Status: suspended')).toBeVisible();
    await expect(listStatus(page)).toContainText(/match/);
    const requests = await recordListRequests(page);

    await filterChip(page, 'Role: Admin').click();

    await expect.poll(requests).toEqual([{ skip: 0, limit: 25, status: 'suspended' }]);
    await expect(roleFilter(page)).toHaveValue('');
    await expect(filterChip(page, 'Status: suspended')).toBeFocused();
    await expect(listStatus(page)).toContainText(/users match/);
  });

  test('removing the search chip empties the field without waiting for a pause', async ({
    page,
  }) => {
    await searchList(page, 'hopper');
    const requests = await recordListRequests(page);

    await filterChip(page, 'Search: hopper').click();

    await expect(searchField(page)).toHaveValue('');
    await expect(searchField(page)).toBeFocused();
    await expect.poll(requests).toEqual([{ skip: 0, limit: 25 }]);
    await expect(listStatus(page)).toHaveText('500,000 users');
  });

  test('Clear all removes every filter with one request and keeps the sort', async ({ page }) => {
    await openList(page);
    const email = page.getByRole('columnheader', { name: 'Email' });
    await email.click();
    await email.click();
    await expect(email).toHaveAttribute('aria-sort', 'descending');
    await searchField(page).fill('hopper');
    await roleFilter(page).selectOption('Viewer');
    await statusFilter(page).selectOption('active');
    await expect(filterChip(page, 'Status: active')).toBeVisible();
    await expect(listStatus(page)).toContainText(/match/);
    const requests = await recordListRequests(page);

    await clearAllButton(page).click();

    await expect(total(page)).toHaveText('500,000 users');
    expect(await requests()).toEqual([
      { skip: 0, limit: 25, sort: { field: 'email', direction: 'desc' } },
    ]);
    await expect(searchField(page)).toHaveValue('');
    await expect(searchField(page)).toBeFocused();
    await expect(roleFilter(page)).toHaveValue('');
    await expect(statusFilter(page)).toHaveValue('');
    await expect(clearAllButton(page)).toBeHidden();
    await expect(page.getByRole('list', { name: 'Active filters' })).toBeHidden();
    await expect(email).toHaveAttribute('aria-sort', 'descending');
  });
});

test.describe('user list empty state', () => {
  test('Clear filters shows every user from the first page and focuses the search field', async ({
    page,
  }) => {
    await openList(page);
    await statusFilter(page).selectOption('suspended');
    await searchField(page).fill('no-such-user-xyz');
    await expect(total(page)).toHaveText('0 users match');
    const requests = await recordListRequests(page);

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(total(page)).toHaveText('500,000 users');
    expect(await requests()).toEqual([{ skip: 0, limit: 25 }]);
    await expect(searchField(page)).toHaveValue('');
    await expect(searchField(page)).toBeFocused();
    await expect(statusFilter(page)).toHaveValue('');
    await expect(statusFilter(page).locator('option:checked')).toHaveText('Any status');
    await expect(page.getByRole('heading', { name: 'No users match' })).toBeHidden();
    await expect(page.getByRole('spinbutton', { name: /Page number/ })).toHaveValue('1');
    await page.locator('.ag-row a').first().waitFor();
  });
});
