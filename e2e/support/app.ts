import { Page, expect } from '@playwright/test';

/** The viewport sizes every screen is checked at: a desktop window and WCAG 1.4.10's 320px. */
export const VIEWPORTS = [
  { name: '1280px', width: 1280, height: 900 },
  { name: '320px', width: 320, height: 800 },
] as const;

/** The themes every screen is checked in, set through the emulated OS color scheme. */
export const COLOR_SCHEMES = ['light', 'dark'] as const;

export const USER_ID = 'u-000042';
export const MISSING_USER_ID = 'u-999999';

export async function openList(page: Page): Promise<void> {
  await page.goto('/users');
  // Placeholder rows render before the page answers; the name link appears only with real data.
  await page.locator('.ag-row a').first().waitFor();
}

export async function openNewUser(page: Page): Promise<void> {
  await page.goto('/users/new');
  await expect(page.getByRole('heading', { level: 1, name: 'New user' })).toBeVisible();
}

export async function openDetail(page: Page, id = USER_ID): Promise<void> {
  await page.goto(`/users/${id}`);
  await page.getByLabel('Name').waitFor();
}

export async function openMissingUser(page: Page): Promise<void> {
  await page.goto(`/users/${MISSING_USER_ID}`);
  await expect(page.getByRole('heading', { level: 1, name: 'User not found' })).toBeVisible();
}

export async function openAbout(page: Page): Promise<void> {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1, name: 'About this app' })).toBeVisible();
}

/** Simulates another admin's edit and saves, which opens the conflict dialog. */
export async function openConflictDialog(page: Page): Promise<void> {
  await openDetail(page);
  await page.getByRole('button', { name: 'Simulate an edit by another admin' }).click();
  await expect(page.getByRole('status')).toContainText('Another admin changed this user.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog', { name: 'This user changed' })).toBeVisible();
}

// The in-memory API has no network to intercept, so failures are forced by replacing a service
// method on a live component through Angular's dev-mode `ng` global. Dev server only.

/** Makes the list's next page load fail and shows its alert. */
export async function forceListFailure(page: Page): Promise<void> {
  await openList(page);
  await page.evaluate(() => {
    const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
    const grid = debug.getComponent(document.querySelector('app-users-grid')!);
    grid.users.loadPage = () => Promise.reject(new Error('Forced failure'));
    grid.refresh();
  });
  await expect(page.getByRole('alert')).toContainText('Users could not be loaded.');
}

/** Makes the detail screen's load fail and shows its alert. */
export async function forceDetailLoadFailure(page: Page): Promise<void> {
  await openDetail(page);
  await page.evaluate(() => {
    const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
    const detail = debug.getComponent(document.querySelector('app-user-detail-page')!);
    detail.users.loadUser = () => Promise.reject(new Error('Forced failure'));
    detail.user.reload();
  });
  await expect(page.getByRole('alert')).toContainText('The user could not be loaded.');
}

/** Makes the detail screen's next save fail and shows its alert. */
export async function forceSaveFailure(page: Page): Promise<void> {
  await openDetail(page);
  await page.evaluate(() => {
    const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
    const detail = debug.getComponent(document.querySelector('app-user-detail-page')!);
    detail.users.saveUser = () => Promise.reject(new Error('Forced failure'));
  });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert')).toContainText('The user could not be saved.');
}

/** Submits the empty new user form so every field error shows. */
export async function showNewUserErrors(page: Page): Promise<void> {
  await openNewUser(page);
  await page.getByRole('button', { name: 'Create user' }).click();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2);
}
