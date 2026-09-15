import { Page, expect, test } from '@playwright/test';
import { openList } from './support/app';

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

  test('columns cannot be resized by dragging a header edge (2.5.7)', async ({ page }) => {
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
});
