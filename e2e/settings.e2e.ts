import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import {
  COLOR_SCHEMES,
  choosePageSize,
  openList,
  openSettingsDialog,
  showFixedHeader,
  storeTableSettings,
  tableSettingsButton,
} from './support/app';
import { applyTextSpacing, clippedText, waitForLoaded } from './support/layout';

/** The Email column's `minWidth` in `users-grid.ts`, the narrowest that keeps its text to two lines. */
const EMAIL_MIN_WIDTH = 240;

const emailHeader = (page: Page) => page.getByRole('columnheader', { name: 'Email' });

/** The index of the last row AG Grid has scrolled into its viewport. */
function lastVisibleRowIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.ag-row[row-index]'));
    return rows.reduce((last, row) => Math.max(last, Number(row.getAttribute('row-index'))), 0);
  });
}

/** Drags the right edge of the Email column header as far left as the grid allows. */
async function dragEmailEdgeLeft(page: Page): Promise<void> {
  const box = (await emailHeader(page).boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 20 });
  await page.mouse.up();
}

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Table settings' });
const settingsButton = tableSettingsButton;
const firstRowHeight = (page: Page) =>
  page
    .locator('.ag-row a')
    .first()
    .evaluate((link) => link.closest('.ag-row')!.getBoundingClientRect().height);

/**
 * Records each text the list status shows from now on, and counts page requests that settle, by
 * wrapping `UsersService.loadPage` on the live grid. Dev server only. Returns a reader.
 */
async function watchList(
  page: Page,
): Promise<() => Promise<{ statusTexts: string[]; settledLoads: number }>> {
  await page.evaluate(() => {
    const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
    const grid = debug.getComponent(document.querySelector('app-users-grid')!);
    const watch = window as unknown as { statusTexts: string[]; settledLoads: number };
    const status = document.querySelector('app-users-page p[role="status"]')!;
    watch.statusTexts = [];
    watch.settledLoads = 0;
    new MutationObserver(() => {
      watch.statusTexts.push(status.textContent?.trim() ?? '');
    }).observe(status, { childList: true, characterData: true, subtree: true });
    const original = grid.users.loadPage.bind(grid.users);
    grid.users.loadPage = (request: unknown) =>
      original(request).finally(() => watch.settledLoads++);
  });
  return () =>
    page.evaluate(() => {
      const watch = window as unknown as { statusTexts: string[]; settledLoads: number };
      return { statusTexts: watch.statusTexts, settledLoads: watch.settledLoads };
    });
}

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

test.describe('table settings dialog', () => {
  test('opens from the list by keyboard, keeps focus inside, and Escape returns focus', async ({
    page,
  }) => {
    await openList(page);
    await expect(settingsButton(page)).toHaveAttribute('aria-haspopup', 'dialog');

    await settingsButton(page).focus();
    await page.keyboard.press('Enter');

    await expect(dialog(page)).toBeVisible();
    await expect(page.locator(':focus')).toHaveRole('heading');
    await expect(page.locator(':focus')).toHaveText('Table settings');
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

  test('Close returns focus to the Table settings button', async ({ page }) => {
    await openSettingsDialog(page);

    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(settingsButton(page)).toBeFocused();
  });

  test('density applies to the list behind the dialog and keeps the page', async ({ page }) => {
    await openList(page);
    for (let next = 0; next < 2; next++) {
      await page.getByRole('button', { name: 'Next Page' }).click();
      await waitForLoaded(page);
    }
    await page.locator('.ag-row a').first().waitFor();
    const pageLabel = await page.locator('.ag-paging-description').textContent();
    expect(await firstRowHeight(page)).toBeCloseTo(48, 0);

    await settingsButton(page).click();
    const watched = await watchList(page);
    await dialog(page).getByRole('radio', { name: 'Comfortable' }).check();
    // Loading never shows, so wait for the reload itself rather than for Loading to leave.
    await expect.poll(async () => (await watched()).settledLoads).toBe(1);
    await page.locator('.ag-row a').first().waitFor();

    await expect.poll(() => firstRowHeight(page)).toBeCloseTo(64, 0);
    await expect(page.locator('.ag-paging-description')).toHaveText(pageLabel!);
    expect((await watched()).statusTexts.join(' | ')).not.toContain('Loading');
  });

  test('a density change right after Next Page still shows loading for the page', async ({
    page,
  }) => {
    await openList(page);
    const pageNumber = page.getByRole('spinbutton', { name: /Page number/ });
    await expect(pageNumber).toHaveValue('1');
    const watched = await watchList(page);

    await page.evaluate(() => {
      const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
      const grid = debug.getComponent(document.querySelector('app-users-grid')!);
      document.querySelector<HTMLElement>('[aria-label="Next Page"]')!.click();
      grid.settings.update({ density: 'comfortable' });
    });

    await expect.poll(async () => (await watched()).statusTexts).toContain('Loading users…');
    await waitForLoaded(page);
    await page.locator('.ag-row a').first().waitFor();
    await expect.poll(() => firstRowHeight(page)).toBeCloseTo(64, 0);
    await expect(pageNumber).toHaveValue('2');
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
    await dialog(page).getByRole('radio', { name: 'Comfortable' }).check();
    await dialog(page).getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await openSettingsDialog(page);

    await expect(dialog(page).getByRole('checkbox', { name: 'Striped rows' })).toBeChecked();
    await expect(dialog(page).getByRole('radio', { name: 'Comfortable' })).toBeChecked();
    await expect(page.locator('app-users-grid')).toHaveClass(/striped/);
    expect(await firstRowHeight(page)).toBeCloseTo(64, 0);
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

  test.describe('resizable columns', () => {
    test('the Email column resizes by drag and by Alt with Left Arrow, down to its minimum', async ({
      page,
    }) => {
      await storeTableSettings(page, { resizableColumns: true });
      await openList(page);
      const before = (await emailHeader(page).boundingBox())!;

      await dragEmailEdgeLeft(page);

      const afterDrag = (await emailHeader(page).boundingBox())!;
      expect(afterDrag.width).toBeLessThan(before.width);
      expect(afterDrag.width).toBeGreaterThanOrEqual(EMAIL_MIN_WIDTH);

      await emailHeader(page).focus();
      for (let press = 0; press < 30; press++) {
        await page.keyboard.press('Alt+ArrowLeft');
      }

      const afterKeys = (await emailHeader(page).boundingBox())!;
      expect(afterKeys.width).toBeLessThan(afterDrag.width);
      expect(afterKeys.width).toBeCloseTo(EMAIL_MIN_WIDTH, 0);

      // At its narrowest the column still shows two lines of cell text under WCAG text spacing.
      await applyTextSpacing(page);
      await waitForLoaded(page);
      expect(await clippedText(page)).toEqual([]);
    });

    test('no column width changes while the setting is off', async ({ page }) => {
      await openList(page);
      const before = (await emailHeader(page).boundingBox())!;

      await dragEmailEdgeLeft(page);
      await emailHeader(page).focus();
      await page.keyboard.press('Alt+ArrowLeft');

      expect((await emailHeader(page).boundingBox())!.width).toBeCloseTo(before.width, 0);
    });
  });

  test.describe('fixed header', () => {
    test('the header stays in view at the last row of a 100-row page', async ({ page }) => {
      await showFixedHeader(page);
      await choosePageSize(page, 100);
      await expect(page.locator('.ag-root.ag-layout-normal')).toBeAttached();
      const header = (await page.locator('.ag-header').boundingBox())!;

      await page.locator('.ag-row:has(a)').first().hover();
      await page.mouse.wheel(0, 6000);
      await expect.poll(() => lastVisibleRowIndex(page)).toBeGreaterThan(50);

      expect((await page.locator('.ag-header').boundingBox())!.y).toBeCloseTo(header.y, 0);
      await expect(page.locator('.ag-header')).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Next Page' })).toBeInViewport();
    });

    test('with the setting off the grid has no scroll area and the header scrolls away', async ({
      page,
    }) => {
      await openList(page);
      await choosePageSize(page, 100);
      await expect(page.locator('.ag-root.ag-layout-auto-height')).toBeAttached();
      const header = (await page.locator('.ag-header').boundingBox())!;

      await page.mouse.wheel(0, 2000);
      await expect
        .poll(async () => (await page.locator('.ag-header').boundingBox())!.y)
        .toBeLessThan(header.y);
    });
  });

  for (const colorScheme of COLOR_SCHEMES) {
    test.describe(`drawn controls in the ${colorScheme} theme`, () => {
      test.use({ colorScheme });

      test('unselected outlines and selected fills are at least 3:1 on the dialog', async ({
        page,
      }) => {
        await openSettingsDialog(page);
        await dialog(page).getByRole('checkbox', { name: 'Striped rows' }).check();
        const colors = await page.evaluate(() => {
          const read = (selector: string) => {
            const style = getComputedStyle(document.querySelector(`dialog ${selector}`)!);
            return { border: style.borderTopColor, background: style.backgroundColor };
          };
          return {
            surface: getComputedStyle(document.querySelector('dialog')!).backgroundColor,
            unselected: read('input:not(:checked)'),
            selected: read('input:checked'),
          };
        });

        expect(
          await contrast(page, colors.unselected.border, colors.surface),
        ).toBeGreaterThanOrEqual(3);
        expect(
          await contrast(page, colors.selected.background, colors.surface),
        ).toBeGreaterThanOrEqual(3);
      });
    });

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
