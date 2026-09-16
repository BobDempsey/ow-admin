import { expect, test } from './support/test';
import { axeViolations } from './support/axe';
import {
  applyTextSpacing,
  clippedText,
  obscuredFocusStops,
  scrollsHorizontally,
  smallTargets,
} from './support/layout';

// Each helper is proved against a page built to fail it, then against a real screen that passes.

test.describe('support helpers catch broken pages', () => {
  test('axe reports missing alt text and low contrast', async ({ page }) => {
    await page.setContent(`
      <html lang="en"><head><title>Broken</title></head><body><main>
        <h1>Broken</h1>
        <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
        <p style="color:#bbb;background:#fff">Faint text</p>
      </main></body></html>`);

    const violations = await axeViolations(page);

    expect(violations.some((line) => line.startsWith('image-alt'))).toBe(true);
    expect(violations.some((line) => line.startsWith('color-contrast'))).toBe(true);
  });

  test('reflow reports a page that scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.setContent('<div style="width:1000px">Too wide</div>');

    expect(await scrollsHorizontally(page)).toBe(true);
  });

  test('focus tabbing reports a control hidden under a fixed banner', async ({ page }) => {
    await page.setContent(`
      <div style="position:fixed;top:0;left:0;right:0;height:120px;background:#000;z-index:1"></div>
      <button style="position:absolute;top:20px;left:20px">Hidden</button>
      <button style="position:absolute;top:300px;left:20px">Visible</button>`);

    expect(await obscuredFocusStops(page, 5)).toEqual(['button "Hidden"']);
  });

  test('target size reports a control under 24 by 24', async ({ page }) => {
    await page.setContent(
      '<button style="width:10px;height:10px;padding:0" aria-label="Tiny"></button>',
    );

    expect(await smallTargets(page)).toEqual(['button. "Tiny" 10x10']);
  });

  test('text spacing reports text clipped by a fixed-height box', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.setContent(`
      <div style="width:200px;height:64px;overflow:hidden;line-height:1;font-size:16px">
        Several words that fit in two short lines before spacing grows
      </div>`);
    expect(await clippedText(page)).toEqual([]);

    await applyTextSpacing(page);

    expect(await clippedText(page)).toHaveLength(1);
  });
});

test('support helpers pass on the new user screen', async ({ page }) => {
  await page.goto('/users/new');
  await expect(page.getByRole('heading', { level: 1, name: 'New user' })).toBeVisible();

  expect(await axeViolations(page)).toEqual([]);
  expect(await scrollsHorizontally(page)).toBe(false);
  expect(await obscuredFocusStops(page)).toEqual([]);
  expect(await smallTargets(page)).toEqual([]);
  await applyTextSpacing(page);
  expect(await clippedText(page)).toEqual([]);
});
