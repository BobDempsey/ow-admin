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

/** The user list's own status line (loading text and search result announcements). */
export const listStatus = (page: Page) => page.locator('app-users-page p[role="status"]');

/** Opens the list and searches it, waiting for the result to be announced. */
export async function searchList(page: Page, text: string): Promise<void> {
  await openList(page);
  await page.getByLabel('Search users').fill(text);
  await expect(listStatus(page)).toContainText(/match/);
}

export const showSearchResults = (page: Page) => searchList(page, 'lamport');
export const showNoSearchResults = (page: Page) => searchList(page, 'no-such-user-xyz');

/**
 * Records every page request the list makes from now on, by wrapping `UsersService.loadPage` on
 * the live grid through `ng.getComponent`. Dev server only. Returns a reader for the requests.
 */
export async function recordListRequests(page: Page): Promise<() => Promise<unknown[]>> {
  await page.evaluate(() => {
    const debug = (window as unknown as { ng: { getComponent(element: Element): any } }).ng;
    const grid = debug.getComponent(document.querySelector('app-users-grid')!);
    const record = window as unknown as { listRequests: unknown[] };
    const original = grid.users.loadPage.bind(grid.users);
    record.listRequests = [];
    grid.users.loadPage = (request: unknown) => {
      record.listRequests.push(request);
      return original(request);
    };
  });
  return () => page.evaluate(() => (window as unknown as { listRequests: unknown[] }).listRequests);
}

/** Opens the Table settings dialog from the button beside the user list's search field. */
export async function openSettingsDialog(page: Page): Promise<void> {
  await openList(page);
  await tableSettingsButton(page).click();
  await expect(page.getByRole('dialog', { name: 'Table settings' })).toBeVisible();
}

/** The user list's Table settings button, which opens the dialog. */
export const tableSettingsButton = (page: Page) =>
  page.getByRole('button', { name: 'Table settings' });

/** Opens Table settings and turns on Draggable columns, which shows the WCAG 2.5.7 note. */
export async function showSettingsWcagNote(page: Page): Promise<void> {
  await openSettingsDialog(page);
  await page.getByRole('checkbox', { name: 'Draggable columns' }).check();
  await expect(page.getByText('Fails WCAG 2.5.7 Dragging Movements.')).toBeVisible();
}

/** Stores table settings before the app loads, as if the admin had chosen them earlier. */
export async function storeTableSettings(
  page: Page,
  settings: {
    striped?: boolean;
    density?: 'comfortable' | 'compact';
    movableColumns?: boolean;
    resizableColumns?: boolean;
    fixedHeader?: boolean;
  },
): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('orbweaver-admin-table-settings', value);
  }, JSON.stringify(settings));
}

/** Opens the user list with Fixed header on, so the grid scrolls its rows under the header. */
export async function showFixedHeader(page: Page): Promise<void> {
  await storeTableSettings(page, { fixedHeader: true });
  await openList(page);
}

/** Chooses a page size through AG Grid's own combobox, which is not a native select. */
export async function choosePageSize(page: Page, size: number): Promise<void> {
  await page.getByRole('combobox', { name: 'Page Size' }).click();
  await page.getByRole('option', { name: String(size), exact: true }).click();
  await page.locator('.ag-row a').first().waitFor();
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
