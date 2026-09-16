import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  FIRST_ROW_NAME,
  actionsButton,
  listStatus,
  openList,
  openRowMenu,
  recordListRequests,
  resetPasswordDialog,
  roleFilter,
  rowMenu,
  showListResetDialog,
} from './support/app';
import { scrollsHorizontally, smallTargets } from './support/layout';

const focused = (page: Page) => page.locator(':focus');
const menuItem = (page: Page, name: 'View' | 'Reset password', user = FIRST_ROW_NAME) =>
  rowMenu(page, user).getByRole('menuitem', { name });

/** True when focus is on the given row's Actions cell, as AG Grid marks a focused cell. */
function actionsCellFocused(page: Page, name = FIRST_ROW_NAME): Promise<boolean> {
  return page.evaluate((label) => {
    const cell = document.activeElement?.closest('.ag-cell');
    return (
      !!cell &&
      cell.getAttribute('col-id') === 'actions' &&
      !!cell.querySelector(`button[aria-label="Actions for ${label}"]`)
    );
  }, name);
}

/** Tabs into the grid and arrows from the header to the first row's Actions cell. */
async function focusFirstActionsCell(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Table settings' }).focus();
  await page.keyboard.press('Tab');
  await expect(focused(page)).toHaveAttribute('role', 'columnheader');
  await page.keyboard.press('ArrowDown');
  for (let press = 0; press < 4; press++) {
    await page.keyboard.press('ArrowRight');
  }
  await expect.poll(() => actionsCellFocused(page)).toBe(true);
}

test.describe('row Actions menu', () => {
  test('the button is named for its user, opens a menu, and is not a Tab stop', async ({
    page,
  }) => {
    await openList(page);
    const button = actionsButton(page);

    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('tabindex', '-1');
  });

  test('opens from the keyboard on the Actions cell, with focus on View', async ({ page }) => {
    await openList(page);
    await focusFirstActionsCell(page);

    await page.keyboard.press('Enter');

    await expect(menuItem(page, 'View')).toBeFocused();
    await expect(rowMenu(page).getByRole('menuitem')).toHaveText(['View', 'Reset password']);
    await expect(actionsButton(page)).toHaveAttribute('aria-expanded', 'true');
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('Space on the Actions cell opens the menu too', async ({ page }) => {
    await openList(page);
    await focusFirstActionsCell(page);

    await page.keyboard.press('Space');

    await expect(menuItem(page, 'View')).toBeFocused();
  });

  test('opens by pointer without opening the user', async ({ page }) => {
    await openList(page);

    await openRowMenu(page);

    await expect(actionsButton(page)).toHaveAttribute('aria-expanded', 'true');
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('View opens the user and focuses their heading', async ({ page }) => {
    await openList(page);
    await openRowMenu(page);
    const href = await menuItem(page, 'View').getAttribute('href');

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(focused(page)).toHaveRole('heading');
    await expect(focused(page)).toHaveText(FIRST_ROW_NAME);
  });

  test('Space on View opens the user as well', async ({ page }) => {
    await openList(page);
    await openRowMenu(page);

    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/\/users\/u-\d{6}$/);
    await expect(focused(page)).toHaveText(FIRST_ROW_NAME);
  });

  test('arrows move through the items and wrap', async ({ page }) => {
    await showMenu(page);

    await page.keyboard.press('ArrowDown');
    await expect(menuItem(page, 'Reset password')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menuItem(page, 'View')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(menuItem(page, 'Reset password')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(menuItem(page, 'View')).toBeFocused();
    await page.keyboard.press('End');
    await expect(menuItem(page, 'Reset password')).toBeFocused();
  });

  test('Escape closes the menu and returns focus to the Actions cell', async ({ page }) => {
    await showMenu(page);

    await page.keyboard.press('Escape');

    await expect(rowMenu(page)).toBeHidden();
    await expect.poll(() => actionsCellFocused(page)).toBe(true);
    await expect(actionsButton(page)).toHaveAttribute('aria-expanded', 'false');
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('Tab closes the menu onto the Actions cell, and the next Tab leaves the grid', async ({
    page,
  }) => {
    await showMenu(page);

    await page.keyboard.press('Tab');

    await expect(rowMenu(page)).toBeHidden();
    await expect.poll(() => actionsCellFocused(page)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.ag-paging-panel'))).toBe(
      true,
    );
  });

  test('a click outside closes the menu without changing the screen', async ({ page }) => {
    await showMenu(page);

    await page.getByRole('heading', { level: 1, name: 'Users' }).click();

    await expect(rowMenu(page)).toBeHidden();
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('clicking the open button closes the menu', async ({ page }) => {
    await showMenu(page);

    await actionsButton(page).click();

    await expect(rowMenu(page)).toBeHidden();
    await expect(actionsButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens below its button and never covers it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await showMenu(page);
    const button = (await actionsButton(page).boundingBox())!;
    const menu = (await rowMenu(page).boundingBox())!;

    expect(menu.y).toBeGreaterThanOrEqual(button.y + button.height);
    expect(menu.x + menu.width).toBeCloseTo(button.x + button.width, 0);
  });
});

test.describe('row Actions menu at 320px', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('fits the viewport for the last row, clear of its button', async ({ page }) => {
    await openList(page);
    const lastName = await page
      .locator('.ag-row:has(a) [col-id="name"] a')
      .last()
      .evaluate((link) => link.textContent?.trim() ?? '');
    await openRowMenu(page, lastName);

    const menu = (await rowMenu(page, lastName).boundingBox())!;
    const button = (await actionsButton(page, lastName).boundingBox())!;
    for (const name of ['View', 'Reset password'] as const) {
      const item = (await menuItem(page, name, lastName).boundingBox())!;
      expect(item.width).toBeGreaterThanOrEqual(24);
      expect(item.height).toBeGreaterThanOrEqual(24);
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.x + item.width).toBeLessThanOrEqual(320);
      expect(item.y + item.height).toBeLessThanOrEqual(568);
    }
    const overlaps =
      menu.x < button.x + button.width &&
      button.x < menu.x + menu.width &&
      menu.y < button.y + button.height &&
      button.y < menu.y + menu.height;
    expect(overlaps).toBe(false);
    expect(await scrollsHorizontally(page)).toBe(false);
    expect(await smallTargets(page)).toEqual([]);
  });
});

test.describe('password reset from a row', () => {
  test('confirming sends one reset, returns focus to the row and leaves the list alone', async ({
    page,
  }) => {
    await openList(page);
    await page.getByRole('button', { name: 'Next Page' }).click();
    await expect(page.getByRole('spinbutton', { name: /Page number/ })).toHaveValue('2');
    await page.locator('.ag-row a').first().waitFor();
    const name = await page
      .locator('.ag-row:has(a) [col-id="name"] a')
      .first()
      .evaluate((link) => link.textContent?.trim() ?? '');
    const listRequests = await recordListRequests(page);
    await page.evaluate(() => {
      const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
      const list = debug.getComponent(document.querySelector('app-users-page')!);
      const record = window as unknown as { resets: string[] };
      const original = list.users.resetPassword.bind(list.users);
      record.resets = [];
      list.users.resetPassword = (id: string) => {
        record.resets.push(id);
        return original(id);
      };
    });

    await openRowMenu(page, name);
    await menuItem(page, 'Reset password', name).click();
    const dialog = resetPasswordDialog(page);
    await expect(dialog).toContainText(name);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Send reset email' }).click();

    await expect(listStatus(page)).toHaveText(`Password reset email sent to ${name}.`);
    await expect.poll(() => actionsCellFocused(page, name)).toBe(true);
    expect(
      await page.evaluate(() => (window as unknown as { resets: string[] }).resets),
    ).toHaveLength(1);
    expect(await listRequests()).toEqual([]);
    await expect(page.getByRole('spinbutton', { name: /Page number/ })).toHaveValue('2');
  });

  test('Escape sends nothing and returns focus to the row', async ({ page }) => {
    await showListResetDialog(page);

    await page.keyboard.press('Escape');

    await expect(resetPasswordDialog(page)).toBeHidden();
    await expect.poll(() => actionsCellFocused(page)).toBe(true);
    await expect(listStatus(page)).not.toContainText('Password reset');
  });

  test('the Actions menu path works with a filter and keeps it', async ({ page }) => {
    await openList(page);
    await roleFilter(page).selectOption('Admin');
    await expect(listStatus(page)).toContainText(/users match/);
    const name = await page
      .locator('.ag-row:has(a) [col-id="name"] a')
      .first()
      .evaluate((link) => link.textContent?.trim() ?? '');
    const listRequests = await recordListRequests(page);

    await openRowMenu(page, name);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await resetPasswordDialog(page).getByRole('button', { name: 'Send reset email' }).click();

    await expect(listStatus(page)).toHaveText(`Password reset email sent to ${name}.`);
    expect(await listRequests()).toEqual([]);
    await expect(roleFilter(page)).toHaveValue('Admin');
  });

  test('a failed reset shows an alert, and Try again sends it without asking', async ({ page }) => {
    await openList(page);
    await page.evaluate(() => {
      const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
      const list = debug.getComponent(document.querySelector('app-users-page')!);
      const original = list.users.resetPassword.bind(list.users);
      let calls = 0;
      list.users.resetPassword = (id: string) =>
        ++calls === 1 ? Promise.reject(new Error('Forced failure')) : original(id);
    });

    await showListResetDialogOnLoadedList(page);
    await resetPasswordDialog(page).getByRole('button', { name: 'Send reset email' }).click();
    const alert = page.getByRole('alert');
    await expect(alert).toContainText(
      `The password reset email to ${FIRST_ROW_NAME} could not be sent.`,
    );

    await alert.getByRole('button', { name: 'Try again' }).click();

    await expect(resetPasswordDialog(page)).toBeHidden();
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(listStatus(page)).toHaveText(`Password reset email sent to ${FIRST_ROW_NAME}.`);
    await expect.poll(() => actionsCellFocused(page)).toBe(true);
  });
});

async function showMenu(page: Page): Promise<void> {
  await openList(page);
  await openRowMenu(page);
}

async function showListResetDialogOnLoadedList(page: Page): Promise<void> {
  await openRowMenu(page);
  await menuItem(page, 'Reset password').click();
  await expect(resetPasswordDialog(page).getByRole('button', { name: 'Cancel' })).toBeFocused();
}
