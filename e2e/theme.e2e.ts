import { Page, expect, test } from '@playwright/test';
import { openAbout, openList } from './support/app';

const root = (page: Page) => page.locator('html');

test.describe('theme control', () => {
  test.use({ colorScheme: 'light' });

  test('starts at System and follows the OS on a first visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openAbout(page);

    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    await expect(root(page)).toHaveAttribute('data-ag-theme-mode', 'dark');
  });

  test('chooses Dark with the arrow keys', async ({ page }) => {
    await openList(page);
    await expect(page.getByRole('group', { name: 'Theme' })).toBeVisible();

    await page.getByRole('radio', { name: 'System' }).focus();
    await page.keyboard.press('ArrowLeft');

    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'System' })).not.toBeChecked();
    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  });

  test('keeps Dark after a reload, applied before the app renders', async ({ page }) => {
    await openAbout(page);
    await page.locator('header label', { hasText: 'Dark' }).click();
    await expect(root(page)).toHaveAttribute('data-theme', 'dark');

    // Records the theme at the moment the parser inserts <app-root>, before Angular's module
    // script runs or anything inside it renders.
    await page.addInitScript(() => {
      const record = window as unknown as Record<string, unknown>;
      const observer = new MutationObserver(() => {
        const appRoot = document.querySelector('app-root');
        if (appRoot) {
          record['themeAtAppRoot'] = document.documentElement.getAttribute('data-theme');
          record['renderedAtAppRoot'] = appRoot.childElementCount > 0;
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    await openAbout(page);

    const early = await page.evaluate(() => {
      const record = window as unknown as Record<string, unknown>;
      return { theme: record['themeAtAppRoot'], rendered: record['renderedAtAppRoot'] };
    });
    expect(early).toEqual({ theme: 'dark', rendered: false });
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  test('System switches when the OS scheme changes', async ({ page }) => {
    await openAbout(page);
    await expect(root(page)).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  test('applies a choice when storage refuses it', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new Error('Storage blocked');
      };
    });
    await openAbout(page);

    await page.locator('header label', { hasText: 'Dark' }).click();

    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });
});
