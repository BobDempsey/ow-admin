import { Page, expect, test } from '@playwright/test';
import { openList, storeTableSettings } from './support/app';
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
