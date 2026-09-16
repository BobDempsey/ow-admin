import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { detailStatus, openDetail, saveBar, showUnsavedEdits } from './support/app';
import { obscuredFocusStops, scrollsHorizontally } from './support/layout';

const barText = (page: Page) => page.locator('#save-bar-status');

/**
 * Tabs forward and back through the page and returns each focused control whose box overlaps the
 * stuck save bar's box. Controls inside the bar are skipped, since they are the bar.
 */
async function controlsUnderBar(page: Page, stops = 30): Promise<string[]> {
  const covered: string[] = [];
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let stop = 0; stop < stops; stop++) {
      await page.keyboard.press(key);
      const result = await page.evaluate(() => {
        const element = document.activeElement;
        const bar = document.querySelector('[data-save-bar-stuck]');
        if (!element || !bar || element === document.body || bar.contains(element)) {
          return undefined;
        }
        const box = element.getBoundingClientRect();
        const barBox = bar.getBoundingClientRect();
        const overlaps = box.bottom > barBox.top && box.top < barBox.bottom;
        return overlaps ? `${element.tagName.toLowerCase()} ${element.textContent?.trim()}` : '';
      });
      if (result) {
        covered.push(result);
      }
    }
  }
  return covered;
}

/** Tabs from the Name field and returns the accessible names focus reaches, in order. */
async function tabOrderFromName(page: Page, count: number): Promise<string[]> {
  await page.getByLabel('Name').focus();
  const names: string[] = [];
  for (let stop = 0; stop < count; stop++) {
    await page.keyboard.press('Tab');
    names.push(
      await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        const label = element?.id
          ? document.querySelector(`label[for="${element.id}"]`)?.textContent
          : undefined;
        return (label ?? element?.textContent ?? '').trim();
      }),
    );
  }
  return names;
}

test.describe('save bar at 320 by 568', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('stays in view with Save, Cancel and its text while there are unsaved edits', async ({
    page,
  }) => {
    await showUnsavedEdits(page);
    await page.evaluate(() => window.scrollTo(0, 0));

    const formBottom = await page
      .locator('app-user-detail-page form')
      .evaluate((form) => form.getBoundingClientRect().bottom);
    expect(formBottom).toBeGreaterThan(568);
    await expect(page.getByRole('button', { name: 'Save' })).toBeInViewport();
    await expect(saveBar(page).getByRole('link', { name: 'Cancel' })).toBeInViewport();
    await expect(barText(page)).toBeInViewport();
    const bar = (await saveBar(page).boundingBox())!;
    expect(bar.y + bar.height).toBeLessThanOrEqual(568);
    expect(await scrollsHorizontally(page)).toBe(false);
  });

  test('sits at the end of the form with no text before any edit', async ({ page }) => {
    await openDetail(page);

    await expect(barText(page)).toHaveText('');
    await expect(saveBar(page)).not.toHaveAttribute('data-save-bar-stuck');
    expect(await saveBar(page).evaluate((bar) => getComputedStyle(bar).position)).toBe('static');
  });

  test('never hides a focused control behind the bar', async ({ page }) => {
    await showUnsavedEdits(page);

    expect(await controlsUnderBar(page)).toEqual([]);
    expect(await obscuredFocusStops(page)).toEqual([]);
  });

  test('keeps the form fields, Save and Cancel before the side cards in Tab order', async ({
    page,
  }) => {
    await openDetail(page);

    expect(await tabOrderFromName(page, 6)).toEqual([
      'Email',
      'Role',
      'Status',
      'Save',
      'Cancel',
      'Reset password',
    ]);
  });
});

test.describe('save bar at 320 by 256', () => {
  test.use({ viewport: { width: 320, height: 256 } });

  test('stays in the flow on a short viewport', async ({ page }) => {
    await showUnsavedEdits(page);

    expect(await saveBar(page).evaluate((bar) => getComputedStyle(bar).position)).toBe('static');
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom),
    ).toBe('auto');
  });
});

test.describe('save bar at 1280 by 600', () => {
  test.use({ viewport: { width: 1280, height: 600 } });

  test('sticks while there are unsaved edits and hides no focused control', async ({ page }) => {
    await showUnsavedEdits(page);

    expect(await saveBar(page).evaluate((bar) => getComputedStyle(bar).position)).toBe('sticky');
    expect(await controlsUnderBar(page)).toEqual([]);
    expect(await obscuredFocusStops(page)).toEqual([]);
  });

  test('keeps the form fields, Save and Cancel before the side cards in Tab order', async ({
    page,
  }) => {
    await openDetail(page);

    expect(await tabOrderFromName(page, 7)).toEqual([
      'Email',
      'Role',
      'Status',
      'Save',
      'Cancel',
      'Reset password',
      'Simulate an edit by another admin',
    ]);
  });

  test('puts the Password and Demo cards to the right of the form', async ({ page }) => {
    await openDetail(page);
    const form = (await page.locator('section[aria-labelledby="details-heading"]').boundingBox())!;
    const password = (await page
      .locator('section[aria-labelledby="password-heading"]')
      .boundingBox())!;

    expect(password.x).toBeGreaterThanOrEqual(form.x + form.width);
  });
});

test('puts the Password and Demo cards below the form at 800px', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await openDetail(page);
  const form = (await page.locator('section[aria-labelledby="details-heading"]').boundingBox())!;
  const demo = (await page.locator('section[aria-labelledby="demo-heading"]').boundingBox())!;

  expect(demo.y).toBeGreaterThanOrEqual(form.y + form.height);
  expect(await scrollsHorizontally(page)).toBe(false);
});

test('announces Unsaved changes once while typing, and clears it on save', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openDetail(page);
  await page.evaluate(() => {
    const record = window as unknown as { barTexts: string[] };
    record.barTexts = [];
    const status = document.querySelector('#save-bar-status')!;
    new MutationObserver(() => record.barTexts.push(status.textContent?.trim() ?? '')).observe(
      status,
      { childList: true, characterData: true, subtree: true },
    );
  });

  await page.getByLabel('Name').focus();
  await page.keyboard.press('End');
  await page.keyboard.type('abcde');
  await expect(barText(page)).toHaveText('Unsaved changes');
  const texts = await page.evaluate(() => (window as unknown as { barTexts: string[] }).barTexts);
  expect(texts.filter(Boolean)).toEqual(['Unsaved changes']);

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(detailStatus(page)).toHaveText('User saved.');
  await expect(barText(page)).toHaveText('');
  await expect(saveBar(page)).not.toHaveAttribute('data-save-bar-stuck');
});
