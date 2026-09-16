import { expect, test } from '@playwright/test';
import {
  navDrawer,
  openAbout,
  openDetail,
  openList,
  openMissingUser,
  openNavDrawer,
  openNewUser,
} from './support/app';

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

  test.describe('reached from the nav drawer at 320px', () => {
    test.use({ viewport: { width: 320, height: 800 } });

    test('about', async ({ page }) => {
      await openList(page);
      await openNavDrawer(page);
      await navDrawer(page).getByRole('link', { name: 'About' }).click();

      await expect(page).toHaveTitle('About | Orbweaver Admin');
    });
  });
});
