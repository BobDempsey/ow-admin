import { expect, test } from './support/test';

test('the user list loads with its heading', async ({ page }) => {
  await page.goto('/users');

  await expect(page.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
});
