import { Page, expect, test } from '@playwright/test';
import { COLOR_SCHEMES, openList, openSettingsDialog, storeTableSettings } from './support/app';
import { waitForLoaded } from './support/layout';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Settings' });
const settingsButton = (page: Page) =>
  page.getByRole('navigation').getByRole('button', { name: 'Settings' });
const firstRowHeight = (page: Page) =>
  page
    .locator('.ag-row a')
    .first()
    .evaluate((link) => link.closest('.ag-row')!.getBoundingClientRect().height);

/** WCAG contrast ratio between two CSS colors, measured from what the browser renders. */
function contrast(page: Page, foreground: string, background: string): Promise<number> {
  return page.evaluate(
    ([fg, bg]) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [light, dark] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    },
    [foreground, background],
  );
}

test.describe('settings dialog', () => {
  test('opens from the nav by keyboard, keeps focus inside, and Escape returns focus', async ({
    page,
  }) => {
    await openList(page);
    await expect(settingsButton(page)).toHaveAttribute('aria-haspopup', 'dialog');

    await settingsButton(page).focus();
    await page.keyboard.press('Enter');

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator(':focus')).toHaveRole('heading');
    await expect(page.locator(':focus')).toHaveText('Settings');
    expect(new URL(page.url()).pathname).toBe('/users');

    for (let press = 0; press < 15; press++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () =>
          !!document.activeElement?.closest('dialog') || document.activeElement === document.body,
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press('Escape');

    await expect(dialog(page)).toBeHidden();
    await expect(settingsButton(page)).toBeFocused();
  });

  test('Close returns focus to Settings', async ({ page }) => {
    await openSettingsDialog(page);

    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(settingsButton(page)).toBeFocused();
  });

  test('theme choices stay in step with the header control', async ({ page }) => {
    await openSettingsDialog(page);

    await dialog(page).getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await expect(
      page.getByRole('group', { name: 'Theme' }).first().getByRole('radio', { name: 'Dark' }),
    ).toBeChecked();
  });

  test('density applies to the list behind the dialog and keeps the page', async ({ page }) => {
    await openList(page);
    for (let next = 0; next < 2; next++) {
      await page.getByRole('button', { name: 'Next Page' }).click();
      await waitForLoaded(page);
    }
    await page.locator('.ag-row a').first().waitFor();
    const pageLabel = await page.locator('.ag-paging-description').textContent();
    expect(await firstRowHeight(page)).toBeCloseTo(64, 0);

    await settingsButton(page).click();
    await dialog(page).getByRole('radio', { name: 'Compact' }).check();
    await waitForLoaded(page);
    await page.locator('.ag-row a').first().waitFor();

    await expect.poll(() => firstRowHeight(page)).toBeCloseTo(48, 0);
    await expect(page.locator('.ag-paging-description')).toHaveText(pageLabel!);
  });

  test('shows the 2.5.7 note only while Draggable columns is on', async ({ page }) => {
    await openSettingsDialog(page);
    const checkbox = dialog(page).getByRole('checkbox', { name: 'Draggable columns' });
    await expect(dialog(page).getByText(/Fails WCAG/)).toHaveCount(0);

    await checkbox.check();

    await expect(dialog(page).getByText('Fails WCAG 2.5.7 Dragging Movements.')).toBeVisible();
    await expect(checkbox).toHaveAccessibleDescription(/2\.5\.7 Dragging Movements/);

    await checkbox.uncheck();

    await expect(dialog(page).getByText(/Fails WCAG/)).toHaveCount(0);
  });

  test('settings survive a reload', async ({ page }) => {
    await openSettingsDialog(page);
    await dialog(page).getByRole('checkbox', { name: 'Striped rows' }).check();
    await dialog(page).getByRole('radio', { name: 'Compact' }).check();
    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await openSettingsDialog(page);

    await expect(dialog(page).getByRole('checkbox', { name: 'Striped rows' })).toBeChecked();
    await expect(dialog(page).getByRole('radio', { name: 'Compact' })).toBeChecked();
    await expect(page.locator('app-users-grid')).toHaveClass(/striped/);
    expect(await firstRowHeight(page)).toBeCloseTo(48, 0);
  });

  test('a setting still applies when storage refuses it', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('Storage blocked');
      };
    });
    await openSettingsDialog(page);

    await dialog(page).getByRole('checkbox', { name: 'Striped rows' }).check();

    await expect(page.locator('app-users-grid')).toHaveClass(/striped/);
    expect(errors).toEqual([]);
  });

  for (const colorScheme of COLOR_SCHEMES) {
    test.describe(`striped rows in the ${colorScheme} theme`, () => {
      test.use({ colorScheme });

      test('odd rows are shaded and their text meets 4.5:1', async ({ page }) => {
        await storeTableSettings(page, { striped: true });
        await openList(page);
        const odd = page.locator('.ag-row-odd:has(a)').first();
        const even = page.locator('.ag-row-even:has(a)').first();
        const colors = async (row: typeof odd) =>
          row.evaluate((element) => ({
            background: getComputedStyle(element).backgroundColor,
            text: getComputedStyle(element.querySelector('.ag-cell:nth-child(2)')!).color,
            link: getComputedStyle(element.querySelector('a')!).color,
          }));
        const oddColors = await colors(odd);
        const evenColors = await colors(even);

        expect(oddColors.background).not.toBe(evenColors.background);
        expect(await contrast(page, oddColors.text, oddColors.background)).toBeGreaterThanOrEqual(
          4.5,
        );
        expect(await contrast(page, oddColors.link, oddColors.background)).toBeGreaterThanOrEqual(
          4.5,
        );
      });
    });
  }
});
