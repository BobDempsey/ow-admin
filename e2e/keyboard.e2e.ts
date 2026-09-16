import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  USER_ID,
  VIEWPORTS,
  choosePageSize,
  filterChip,
  openDetail,
  openList,
  openMissingUser,
  openNewUser,
  menuButton,
  navDrawer,
  resetPasswordDialog,
  showChipsList,
  showFixedHeader,
  showNoSearchResults,
} from './support/app';
import { obscuredFocusStops } from './support/layout';

/** Presses `key` until the focused element's text is `name`, failing after `max` presses. */
async function pressUntilFocused(page: Page, name: string, key = 'Tab', max = 40): Promise<void> {
  for (let press = 0; press < max; press++) {
    await page.keyboard.press(key);
    const text = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (text === name) {
      return;
    }
  }
  throw new Error(`Focus never reached "${name}"`);
}

const focused = (page: Page) => page.locator(':focus');

/** True when the focused element is entirely outside the viewport or covered at every corner. */
function focusHidden(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const inset = 1;
    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + inset, rect.top + inset],
      [rect.right - inset, rect.top + inset],
      [rect.left + inset, rect.bottom - inset],
      [rect.right - inset, rect.bottom - inset],
    ];
    return !points.some(([x, y]) => {
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
        return false;
      }
      const hit = document.elementFromPoint(x, y);
      return !!hit && (hit === element || element.contains(hit) || hit.contains(element));
    });
  });
}

test.describe('keyboard flows', () => {
  test('skip link moves focus to main without changing the URL', async ({ page }) => {
    await openList(page);

    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveText('Skip to main content');
    await page.keyboard.press('Enter');

    await expect(focused(page)).toHaveAttribute('id', 'main');
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('nav: Users is reachable and placeholders say they are unavailable', async ({ page }) => {
    await openNewUser(page);

    await pressUntilFocused(page, 'Users');
    await expect(focused(page)).toHaveAttribute('href', '/users');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Reports (not available yet)');
    await expect(focused(page)).toHaveAttribute('aria-disabled', 'true');
  });

  test('nav: About follows Settings and opens the About screen', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'Settings (not available yet)');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAttribute('href', '/about');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/about$/);
    await expect(focused(page)).toHaveRole('heading');
    await expect(focused(page)).toHaveText('About this app');
    await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
  });

  test('header: the Theme button follows the nav, and Tab closes its open menu', async ({
    page,
  }) => {
    await openList(page);

    await pressUntilFocused(page, 'About');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Theme');

    await page.keyboard.press('Enter');
    await expect(focused(page)).toHaveText('System');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('menu', { name: 'Theme' })).toBeHidden();
    await expect(focused(page)).toHaveAccessibleName('New user');
  });

  test('list: the grid is one tab stop and Enter on a row opens the user', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'New user');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Search users');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Role');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Status');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Table settings');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAttribute('role', 'columnheader');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/users\/u-\d{6}$/);
    await expect(focused(page)).toHaveRole('heading');
  });

  test('list: Enter on a column header sorts without opening a user', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'New user');
    // Search, Role, Status, Table settings, then the grid.
    for (let press = 0; press < 5; press++) {
      await page.keyboard.press('Tab');
    }
    await expect(focused(page)).toHaveAttribute('role', 'columnheader');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('columnheader', { name: 'Role' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('list: Tab leaves the grid for the pagination controls', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'New user');
    // Search, Role, Status, Table settings, the grid, then the pagination controls.
    for (let press = 0; press < 6; press++) {
      await page.keyboard.press('Tab');
    }

    const inPaging = await page.evaluate(
      () => !!document.activeElement?.closest('.ag-paging-panel'),
    );
    expect(inPaging).toBe(true);
  });

  test('list: chips and Clear all come after Table settings and before the grid', async ({
    page,
  }) => {
    await showChipsList(page);

    await page.getByLabel('Search users').focus();
    const stops = [
      'Role',
      'Status',
      'Table settings',
      'Remove filter Search: hopper',
      'Remove filter Role: Admin',
      'Remove filter Status: active',
      'Clear all',
    ];
    for (const name of stops) {
      await page.keyboard.press('Tab');
      await expect(focused(page)).toHaveAccessibleName(name);
    }
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAttribute('role', 'columnheader');
  });

  test('list: Enter removes a chip and Space on Clear all clears the rest', async ({ page }) => {
    await showChipsList(page);

    await filterChip(page, 'Role: Admin').focus();
    await page.keyboard.press('Enter');
    await expect(filterChip(page, 'Role: Admin')).toHaveCount(0);
    await expect(focused(page)).toHaveAccessibleName('Remove filter Status: active');
    await expect(page.getByLabel('Role', { exact: true })).toHaveValue('');

    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAccessibleName('Clear all');
    await page.keyboard.press('Space');

    await expect(focused(page)).toHaveAccessibleName('Search users');
    await expect(page.getByLabel('Search users')).toHaveValue('');
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('');
    await expect(page.getByRole('list', { name: 'Active filters' })).toBeHidden();
  });

  test('list: Tab from the search field reaches Clear filters, and Enter clears', async ({
    page,
  }) => {
    await showNoSearchResults(page);

    await page.getByLabel('Search users').focus();
    await pressUntilFocused(page, 'Clear filters');
    await page.keyboard.press('Enter');

    await expect(focused(page)).toHaveAccessibleName('Search users');
    await expect(page.getByLabel('Search users')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeHidden();
    await page.locator('.ag-row a').first().waitFor();
  });

  test('list: a fixed header never hides the focused cell while arrowing a 100-row page', async ({
    page,
  }) => {
    await showFixedHeader(page);
    await choosePageSize(page, 100);
    await page.getByRole('columnheader', { name: 'Name' }).focus();
    const hidden: string[] = [];

    for (const key of ['ArrowDown', 'ArrowUp']) {
      for (let press = 0; press < 100; press++) {
        await page.keyboard.press(key);
        if (await focusHidden(page)) {
          hidden.push(`${key} ${press}`);
        }
      }
    }

    expect(hidden).toEqual([]);
  });

  test('create: errors take focus, then a valid user opens with a notice', async ({ page }) => {
    await openList(page);
    await pressUntilFocused(page, 'New user');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/users\/new$/);
    await expect(focused(page)).toHaveText('New user');

    await pressUntilFocused(page, 'Create user');
    await page.keyboard.press('Enter');
    await expect(focused(page)).toHaveAccessibleName('Name');
    await expect(focused(page)).toHaveAccessibleDescription('Enter a name');

    await page.keyboard.type('Grace Hopper');
    await page.keyboard.press('Tab');
    await page.keyboard.type('grace@example.com');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/users\/u-500000$/);
    await expect(page.getByRole('status')).toHaveText('User created.');
    await expect(focused(page)).toHaveText('Grace Hopper');
  });

  test('edit: save and cancel work from the keyboard', async ({ page }) => {
    await openDetail(page);
    const name = page.getByLabel('Name');
    const original = await name.inputValue();

    await name.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' Jr');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('User saved.');

    await name.focus();
    await page.keyboard.type(' III');
    await pressUntilFocused(page, 'Cancel');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/users$/);
    await expect(focused(page)).toHaveRole('heading');
    await expect(focused(page)).toHaveText('Users');

    // Back reopens the user inside the app, so the in-memory store keeps the saved name.
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/users/${USER_ID}$`));
    await expect(name).toHaveValue(`${original} Jr`);
  });

  test('conflict: dialog traps focus, Escape keeps edits, Reload and Overwrite work', async ({
    page,
  }) => {
    await openDetail(page);
    const name = page.getByLabel('Name');
    const status = page.getByLabel('Status');
    const dialog = page.getByRole('dialog', { name: 'This user changed' });
    const simulate = async () => {
      await pressUntilFocused(page, 'Simulate an edit by another admin');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('status')).toContainText('Another admin changed this user.');
    };
    const save = async () => {
      await pressUntilFocused(page, 'Save', 'Shift+Tab');
      await page.keyboard.press('Enter');
      await expect(dialog).toBeVisible();
      await expect(focused(page)).toHaveText('Keep editing');
    };

    await name.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' edited');
    await simulate();
    await save();

    const stops: string[] = [];
    for (let press = 0; press < 6; press++) {
      await page.keyboard.press('Tab');
      stops.push(
        await page.evaluate(() =>
          document.activeElement?.closest('dialog')
            ? (document.activeElement.textContent?.trim() ?? '')
            : document.activeElement === document.body
              ? '(browser)'
              : `outside: ${document.activeElement?.textContent?.trim()}`,
        ),
      );
    }
    expect(stops.filter((stop) => stop.startsWith('outside'))).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(focused(page)).toHaveText('Save');
    await expect(name).toHaveValue(/ edited$/);

    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await pressUntilFocused(page, 'Reload');
    const statusBefore = await status.inputValue();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(name).not.toHaveValue(/ edited$/);
    await expect(focused(page)).toHaveText('Save');
    expect(statusBefore).toBeTruthy();

    await name.focus();
    await page.keyboard.press('End');
    await page.keyboard.type(' overwritten');
    await simulate();
    await save();
    await pressUntilFocused(page, 'Overwrite');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('User saved.');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ overwritten\s*$/);
  });

  test('password reset: Escape sends nothing, and confirming sends one request', async ({
    page,
  }) => {
    await openDetail(page);
    // Count reset requests by wrapping the service method on the live page. Dev server only.
    await page.evaluate(() => {
      const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
      const detail = debug.getComponent(document.querySelector('app-user-detail-page')!);
      const record = window as unknown as { resetRequests: string[] };
      const original = detail.users.resetPassword.bind(detail.users);
      record.resetRequests = [];
      detail.users.resetPassword = (id: string) => {
        record.resetRequests.push(id);
        return original(id);
      };
    });
    const resetRequests = () =>
      page.evaluate(() => (window as unknown as { resetRequests: string[] }).resetRequests);
    const dialog = resetPasswordDialog(page);

    await page.getByLabel('Status').focus();
    await pressUntilFocused(page, 'Reset password');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(focused(page)).toHaveText('Cancel');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(focused(page)).toHaveText('Reset password');
    expect(await resetRequests()).toEqual([]);
    await expect(page.getByRole('status')).toHaveText('');

    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(focused(page)).toHaveText('Cancel');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveText('Send reset email');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('status')).toHaveText('Password reset email sent.');
    await expect(dialog).toBeHidden();
    await expect(focused(page)).toHaveText('Reset password');
    expect(await resetRequests()).toEqual([USER_ID]);
  });
});

test.describe('the nav drawer at 320px', () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test('opens from the keyboard, traps focus, and Escape returns to the Menu button', async ({
    page,
  }) => {
    await openList(page);

    await pressUntilFocused(page, 'Menu');
    await page.keyboard.press('Enter');
    await expect(navDrawer(page)).toBeVisible();
    await expect(focused(page)).toHaveText('Menu');
    await expect(focused(page)).toHaveRole('heading');

    const stops: string[] = [];
    for (let press = 0; press < 8; press++) {
      await page.keyboard.press('Tab');
      stops.push(
        await page.evaluate(() =>
          document.activeElement?.closest('dialog')
            ? (document.activeElement.textContent?.trim() ?? '')
            : document.activeElement === document.body
              ? '(browser)'
              : `outside: ${document.activeElement?.textContent?.trim()}`,
        ),
      );
    }
    expect(stops.filter((stop) => stop.startsWith('outside'))).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(navDrawer(page)).toBeHidden();
    await expect(focused(page)).toHaveAccessibleName('Menu');
    expect(new URL(page.url()).pathname).toBe('/users');
  });

  test('marks the current screen, and an entry navigates and closes the drawer', async ({
    page,
  }) => {
    await openList(page);
    await menuButton(page).click();
    await expect(navDrawer(page)).toBeVisible();

    const current = navDrawer(page).locator('[aria-current]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Users');

    await pressUntilFocused(page, 'About');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/about$/);
    await expect(navDrawer(page)).toBeHidden();
    await expect(focused(page)).toHaveRole('heading');
    await expect(focused(page)).toHaveText('About this app');
  });

  test('Enter on the current screen closes the drawer and returns to the Menu button', async ({
    page,
  }) => {
    await openList(page);
    await pressUntilFocused(page, 'Menu');
    await page.keyboard.press('Enter');
    await expect(navDrawer(page)).toBeVisible();

    await pressUntilFocused(page, 'Users');
    await page.keyboard.press('Enter');

    await expect(navDrawer(page)).toBeHidden();
    await expect(focused(page)).toHaveAccessibleName('Menu');
    expect(new URL(page.url()).pathname).toBe('/users');
  });
});

for (const viewport of VIEWPORTS) {
  test.describe(`focus is never fully hidden at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    const screens: [string, (page: Page) => Promise<void>][] = [
      ['user list', openList],
      ['new user', openNewUser],
      ['user detail', openDetail],
      ['user not found', openMissingUser],
    ];
    for (const [name, open] of screens) {
      test(name, async ({ page }) => {
        await open(page);

        expect(await obscuredFocusStops(page)).toEqual([]);
      });
    }
  });
}
