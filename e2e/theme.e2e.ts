import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { chooseTheme, openAbout, openList, openThemeMenu, themeButton } from './support/app';

const root = (page: Page) => page.locator('html');
const focused = (page: Page) => page.locator(':focus');
const choice = (page: Page, name: string) => page.getByRole('menuitemradio', { name, exact: true });

test.describe('theme control', () => {
  test.use({ colorScheme: 'light' });

  test('starts at System and follows the OS on a first visit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openAbout(page);
    await openThemeMenu(page);

    await expect(choice(page, 'System')).toHaveAttribute('aria-checked', 'true');
    await expect(choice(page, 'Light')).toHaveAttribute('aria-checked', 'false');
    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    await expect(root(page)).toHaveAttribute('data-ag-theme-mode', 'dark');
  });

  test('opens and chooses Dark from the keyboard', async ({ page }) => {
    await openList(page);
    await expect(themeButton(page)).toHaveAttribute('aria-expanded', 'false');

    await themeButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(themeButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(focused(page)).toHaveText('System');

    await page.keyboard.press('Home');
    await expect(focused(page)).toHaveText('Light');
    await page.keyboard.press('ArrowDown');
    await expect(focused(page)).toHaveText('Dark');
    await page.keyboard.press('Enter');

    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('menu', { name: 'Theme' })).toBeHidden();
    await expect(focused(page)).toHaveText('Theme');
    await openThemeMenu(page);
    await expect(choice(page, 'Dark')).toHaveAttribute('aria-checked', 'true');
  });

  test('Escape closes the menu without changing the choice', async ({ page }) => {
    await openList(page);
    await themeButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(focused(page)).toHaveText('System');

    await page.keyboard.press('Home');
    await expect(focused(page)).toHaveText('Light');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('menu', { name: 'Theme' })).toBeHidden();
    await expect(root(page)).toHaveAttribute('data-theme', 'light');
    await expect(focused(page)).toHaveText('Theme');
  });

  test('a click outside closes the menu without changing the choice', async ({ page }) => {
    await openList(page);
    await openThemeMenu(page);

    await page.getByRole('heading', { level: 1 }).click();

    await expect(page.getByRole('menu', { name: 'Theme' })).toBeHidden();
    await expect(root(page)).toHaveAttribute('data-theme', 'light');
  });

  test('keeps Dark after a reload, applied before the app renders', async ({ page }) => {
    await openAbout(page);
    await chooseTheme(page, 'Dark');
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
    await openThemeMenu(page);
    await expect(choice(page, 'Dark')).toHaveAttribute('aria-checked', 'true');
  });

  test('System switches when the OS scheme changes', async ({ page }) => {
    await openAbout(page);
    await expect(root(page)).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    await openThemeMenu(page);
    await expect(choice(page, 'System')).toHaveAttribute('aria-checked', 'true');
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

    await chooseTheme(page, 'Dark');

    await expect(root(page)).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });
});
