import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { openList, recordListRequests, storeTableSettings } from './support/app';
import { applyTextSpacing, clippedText, waitForLoaded } from './support/layout';

const headerNames = (page: Page) =>
  page
    .getByRole('columnheader')
    .evaluateAll((headers) => headers.map((header) => header.textContent?.trim() ?? ''));

test.describe('user grid', () => {
  test('exposes a grid with named column headers and the full row count', async ({ page }) => {
    await openList(page);
    const grid = page.getByRole('treegrid').or(page.getByRole('grid')).first();

    await expect(grid).toBeVisible();
    expect(await headerNames(page)).toEqual(['Name', 'Email', 'Role', 'Status']);
    // aria-rowcount counts the header row as well as every user.
    await expect(grid).toHaveAttribute('aria-rowcount', '500001');
  });

  test('columns cannot be reordered by dragging a header (2.5.7)', async ({ page }) => {
    await openList(page);
    const email = page.getByRole('columnheader', { name: 'Email' });
    const name = page.getByRole('columnheader', { name: 'Name' });

    await email.dragTo(name);

    expect(await headerNames(page)).toEqual(['Name', 'Email', 'Role', 'Status']);
  });

  test('columns can be reordered by dragging after turning on Draggable columns', async ({
    page,
  }) => {
    await storeTableSettings(page, { movableColumns: true });
    await openList(page);
    const email = page.getByRole('columnheader', { name: 'Email' });
    const name = page.getByRole('columnheader', { name: 'Name' });

    await email.hover();
    await page.mouse.down();
    const target = (await name.boundingBox())!;
    await page.mouse.move(target.x + 10, target.y + target.height / 2, { steps: 20 });
    await page.mouse.up();

    await expect.poll(() => headerNames(page)).toEqual(['Email', 'Name', 'Role', 'Status']);
  });

  test('compact rows keep cell text whole under text spacing at 320px (1.4.12)', async ({
    page,
  }) => {
    await storeTableSettings(page, { density: 'compact' });
    await page.setViewportSize({ width: 320, height: 800 });
    await openList(page);
    await applyTextSpacing(page);
    await waitForLoaded(page);
    await page.locator('.ag-row a').first().waitFor();

    const row = page.locator('.ag-row a').first().locator('xpath=ancestor::div[@role="row"]');
    expect((await row.boundingBox())!.height).toBeCloseTo(48, 0);
    expect(await clippedText(page)).toEqual([]);
  });

  test('a user keeps the same initials circle color after paging away and back', async ({
    page,
  }) => {
    await openList(page);
    const circle = page
      .locator('.ag-row:has(a)', { hasText: 'Ada Allen' })
      .locator('[col-id="name"] span[aria-hidden="true"]');
    const before = await circle.getAttribute('class');
    const pageNumber = page.getByRole('spinbutton', { name: /Page number/ });

    await page.getByRole('button', { name: 'Next Page' }).click();
    await expect(pageNumber).toHaveAccessibleName(/Page number, 2 of/);
    await page.locator('.ag-row a').first().waitFor();
    await page.getByRole('button', { name: 'Previous Page' }).click();
    await expect(pageNumber).toHaveAccessibleName(/Page number, 1 of/);

    await expect(circle).toHaveText('AA');
    expect(await circle.getAttribute('class')).toBe(before);
    expect(before).toMatch(/bg-avatar-\d-surface/);
  });

  for (const movableColumns of [false, true]) {
    test(`columns cannot be resized by dragging a header edge with Draggable columns ${movableColumns ? 'on' : 'off'} (2.5.7)`, async ({
      page,
    }) => {
      await storeTableSettings(page, { movableColumns });
      await openList(page);
      const role = page.getByRole('columnheader', { name: 'Role' });
      const before = (await role.boundingBox())!;

      await page.mouse.move(before.x + before.width - 2, before.y + before.height / 2);
      await page.mouse.down();
      await page.mouse.move(before.x + before.width + 120, before.y + before.height / 2, {
        steps: 10,
      });
      await page.mouse.up();

      expect((await role.boundingBox())!.width).toBeCloseTo(before.width, 0);
    });
  }
});

test.describe('user grid sorting', () => {
  const firstEmails = (page: Page) =>
    page
      .locator('.ag-row:has(a)')
      .evaluateAll((rows) =>
        rows
          .map((row) => row.querySelector('[col-id="email"]')?.textContent?.trim() ?? '')
          .filter(Boolean),
      );
  const header = (page: Page, name: string) => page.getByRole('columnheader', { name });
  const lastRequest = async (read: () => Promise<unknown[]>) => (await read()).at(-1);

  test('clicking a header sorts ascending, then descending, then clears', async ({ page }) => {
    await openList(page);
    const requests = await recordListRequests(page);

    await header(page, 'Email').click();
    await expect
      .poll(() => lastRequest(requests))
      .toEqual({
        skip: 0,
        limit: 25,
        sort: { field: 'email', direction: 'asc' },
      });
    await expect(header(page, 'Email')).toHaveAttribute('aria-sort', 'ascending');
    await expect
      .poll(async () => {
        const emails = await firstEmails(page);
        return emails.length > 1 && emails.every((email, i) => i === 0 || emails[i - 1] <= email);
      })
      .toBe(true);

    await header(page, 'Email').click();
    await expect
      .poll(() => lastRequest(requests))
      .toEqual({
        skip: 0,
        limit: 25,
        sort: { field: 'email', direction: 'desc' },
      });
    await expect(header(page, 'Email')).toHaveAttribute('aria-sort', 'descending');

    await header(page, 'Email').click();
    await expect.poll(() => lastRequest(requests)).toEqual({ skip: 0, limit: 25 });
    await expect(header(page, 'Email')).not.toHaveAttribute('aria-sort', /ascending|descending/);
    await expect(header(page, 'Name')).not.toHaveAttribute('aria-sort', /ascending|descending/);
  });

  test('paging keeps the sort', async ({ page }) => {
    await openList(page);
    const requests = await recordListRequests(page);
    await header(page, 'Status').click();
    await expect.poll(async () => (await requests()).length).toBe(1);

    await page.getByRole('button', { name: 'Next Page' }).click();

    await expect
      .poll(() => lastRequest(requests))
      .toEqual({
        skip: 25,
        limit: 25,
        sort: { field: 'status', direction: 'asc' },
      });
  });
});
