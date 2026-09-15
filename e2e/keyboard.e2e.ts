import { Page, expect, test } from '@playwright/test';
import { VIEWPORTS, openDetail, openList, openMissingUser, openNewUser } from './support/app';
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

  test('list: the grid is one tab stop and Enter on a row opens the user', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'New user');
    await page.keyboard.press('Tab');
    await expect(focused(page)).toHaveAttribute('role', 'columnheader');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/users\/u-\d{6}$/);
    await expect(focused(page)).toHaveRole('heading');
  });

  test('list: Tab leaves the grid for the pagination controls', async ({ page }) => {
    await openList(page);

    await pressUntilFocused(page, 'New user');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const inPaging = await page.evaluate(
      () => !!document.activeElement?.closest('.ag-paging-panel'),
    );
    expect(inPaging).toBe(true);
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
    await expect(focused(page)).toHaveAccessibleDescription('Enter a name.');

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
