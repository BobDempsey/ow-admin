import { expect, test } from '@playwright/test';
import { openAbout, openDetail, openList, openMissingUser, openNewUser } from './support/app';

test.describe('page titles (2.4.2)', () => {
  test('user list', async ({ page }) => {
    await openList(page);

    await expect(page).toHaveTitle('Users | Orbweaver Admin');
  });

  test('new user', async ({ page }) => {
    await openNewUser(page);

    await expect(page).toHaveTitle('New user | Orbweaver Admin');
  });

  test('user detail names the user', async ({ page }) => {
    await openDetail(page);
    const name = await page.getByRole('heading', { level: 1 }).innerText();

    await expect(page).toHaveTitle(`${name} | Orbweaver Admin`);
  });

  test('about', async ({ page }) => {
    await openAbout(page);

    await expect(page).toHaveTitle('About | Orbweaver Admin');
  });

  test('user not found', async ({ page }) => {
    await openMissingUser(page);

    await expect(page).toHaveTitle('User not found | Orbweaver Admin');
  });
});
