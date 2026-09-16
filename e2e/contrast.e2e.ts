import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { COLOR_SCHEMES, openAbout, openList, storeTableSettings } from './support/app';
import { contrast, tokenContrast } from './support/contrast';

/** A foreground and background token pair and the ratio it must reach (WCAG 1.4.3, 1.4.11). */
interface TokenPair {
  name: string;
  foreground: string;
  background: string;
  minimum: number;
}

const TEXT = 4.5;
const NON_TEXT = 3;

const STATUS_PAIRS: TokenPair[] = ['active', 'invited', 'suspended'].map((status) => ({
  name: `${status} pill text`,
  foreground: `status-${status}-ink`,
  background: `status-${status}-surface`,
  minimum: TEXT,
}));

const AVATAR_PAIRS: TokenPair[] = [1, 2, 3, 4, 5, 6].map((index) => ({
  name: `avatar ${index} initials`,
  foreground: `avatar-${index}-ink`,
  background: `avatar-${index}-surface`,
  minimum: TEXT,
}));

const NAV_PAIRS: TokenPair[] = [
  {
    name: 'current-screen underline on the surface',
    foreground: 'nav-current',
    background: 'surface',
    minimum: NON_TEXT,
  },
  {
    name: 'current-screen underline on the hover fill',
    foreground: 'nav-current',
    background: 'surface-muted',
    minimum: NON_TEXT,
  },
];

/** Decorative pairs have no minimum; they are measured so docs/accessibility.md can record them. */
const DECORATIVE_PAIRS: TokenPair[] = [
  { name: 'card border', foreground: 'line-subtle', background: 'surface', minimum: 1 },
  { name: 'skeleton bar', foreground: 'skeleton', background: 'surface', minimum: 1 },
];

const PAIRS = [...STATUS_PAIRS, ...AVATAR_PAIRS, ...NAV_PAIRS, ...DECORATIVE_PAIRS];

/** The computed shadow of a probe drawn with the card shadow token. */
function cardShadow(page: Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.boxShadow = 'var(--shadow-card)';
    document.body.append(probe);
    const shadow = getComputedStyle(probe).boxShadow;
    probe.remove();
    return shadow;
  });
}

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`token contrast, ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ page }) => {
      await openAbout(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    });

    for (const pair of PAIRS) {
      test(`${pair.name} reaches ${pair.minimum}:1`, async ({ page }) => {
        const ratio = await tokenContrast(page, pair.foreground, pair.background);
        console.log(`${colorScheme}: ${pair.name} ${ratio.toFixed(2)}:1`);
        expect(ratio).toBeGreaterThanOrEqual(pair.minimum);
      });
    }
  });
}

/**
 * The color of the last shadow in a computed `box-shadow` list, such as
 * `oklch(...) 0px -1px 0px 0px inset`. Tailwind puts empty ring shadows before the header's own.
 */
function lastShadowColor(shadows: string): string {
  const last = shadows
    .split(/,(?![^(]*\))/)
    .at(-1)!
    .trim();
  return last.match(/^(.*\))\s/)?.[1] ?? last;
}

/** The colors the header draws, read from its rendered elements. */
async function headerColors(page: Page) {
  const header = page.locator('header');
  const users = header.getByRole('link', { name: 'Users', exact: true });
  const placeholder = header.getByRole('button', { name: 'Reports (not available yet)' });
  const iconButton = header.getByRole('button', { name: 'AI assistant' });
  const theme = header.getByRole('button', { name: /^Theme/ });
  const style = (locator: typeof users, property: string) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
  const rest = () => page.mouse.move(0, 400);
  // Icon buttons fade their colors, so read them only once the fade has finished.
  const settled = (locator: typeof users) =>
    locator.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
  await expect(users).toHaveAttribute('aria-current', 'page');

  const surface = await style(header, 'background-color');
  const bottomRule = lastShadowColor(await style(header, 'box-shadow'));
  const text = await style(users, 'color');
  const underline = await style(users, 'border-bottom-color');
  const placeholderText = await style(placeholder, 'color');
  const icon = await style(iconButton, 'color');
  const themeIcon = await style(theme, 'color');
  await users.hover();
  const hover = await style(users, 'background-color');
  await iconButton.hover();
  await settled(iconButton);
  const iconHoverFill = await style(iconButton, 'background-color');
  const iconHover = await style(iconButton, 'color');
  await rest();
  await users.focus();
  const focusRing = await style(users, 'outline-color');
  await rest();
  await iconButton.focus();
  await settled(iconButton);
  const iconFocusRing = await style(iconButton, 'outline-color');
  const iconFocusStyle = await style(iconButton, 'outline-style');
  return {
    surface,
    bottomRule,
    text,
    underline,
    placeholderText,
    icon,
    themeIcon,
    hover,
    iconHoverFill,
    iconHover,
    focusRing,
    iconFocusRing,
    iconFocusStyle,
  };
}

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`header contrast, ${colorScheme} theme at 1280px`, () => {
    test.use({ colorScheme, viewport: { width: 1280, height: 900 } });

    test('text, icon buttons, focus ring and underline meet their minimums', async ({ page }) => {
      await page.goto('/users');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      const colors = await headerColors(page);
      const ratio = async (foreground: string, background: string) =>
        Number((await contrast(page, foreground, background)).toFixed(2));
      const ratios = {
        text: await ratio(colors.text, colors.surface),
        textOnHover: await ratio(colors.text, colors.hover),
        placeholder: await ratio(colors.placeholderText, colors.surface),
        mutedIcon: await ratio(colors.icon, colors.surface),
        mutedOnHoverFill: await ratio(colors.icon, colors.iconHoverFill),
        iconOnHover: await ratio(colors.iconHover, colors.iconHoverFill),
        focusRing: await ratio(colors.focusRing, colors.surface),
        focusRingOnHover: await ratio(colors.focusRing, colors.hover),
        iconFocusRing: await ratio(colors.iconFocusRing, colors.surface),
        underline: await ratio(colors.underline, colors.surface),
        underlineOnHover: await ratio(colors.underline, colors.hover),
        // Decorative, so it has no minimum; measured so docs/accessibility.md can record it. The
        // light rule is transparent, which the canvas would draw as black, so it is not measured.
        bottomRule:
          colorScheme === 'dark' ? await ratio(colors.bottomRule, colors.surface) : undefined,
      };
      console.log(`${colorScheme} header colors: ${JSON.stringify(colors)}`);
      console.log(`${colorScheme} header ratios: ${JSON.stringify(ratios)}`);

      expect(colors.hover).not.toBe(colors.surface);
      expect(colors.iconHoverFill).toBe(colors.hover);
      expect(colors.themeIcon).toBe(colors.icon);
      expect(colors.placeholderText).toBe(colors.icon);
      expect(colors.iconFocusStyle).toBe('solid');
      expect(ratios.text).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.textOnHover).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.placeholder).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.mutedIcon).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.mutedOnHoverFill).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.iconOnHover).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.focusRing).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.focusRingOnHover).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.iconFocusRing).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.underline).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.underlineOnHover).toBeGreaterThanOrEqual(NON_TEXT);
      if (colorScheme === 'light') {
        expect(colors.bottomRule).toMatch(/^(transparent|rgba\(0, 0, 0, 0\)|oklab\(0 0 0 \/ 0\))$/);
      } else {
        expect(colors.bottomRule).not.toBe(colors.surface);
      }
    });
  });
}

/** The text and fill of the first pill in a grid cell matching `selector`, with its word. */
function pillColors(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .locator('span')
    .first()
    .evaluate((pill) => {
      const style = getComputedStyle(pill);
      return { word: pill.textContent?.trim(), text: style.color, fill: style.backgroundColor };
    });
}

const statusCell = (status: string) =>
  `.ag-row:has(a) [col-id="status"]:has(span:text-is("${status}"))`;

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`pill contrast, ${colorScheme} theme`, () => {
    test.use({ colorScheme, viewport: { width: 1280, height: 900 } });

    test('each status pill reaches 4.5:1 against its own fill', async ({ page }) => {
      await openList(page);
      const fills = new Set<string>();
      for (const status of ['active', 'invited', 'suspended']) {
        const pill = await pillColors(page, statusCell(status));
        const ratio = await contrast(page, pill.text, pill.fill);
        console.log(`${colorScheme}: ${status} pill ${ratio.toFixed(2)}:1`);
        expect(pill.word).toBe(status);
        expect(ratio).toBeGreaterThanOrEqual(TEXT);
        fills.add(pill.fill);
      }
      expect(fills.size).toBe(3);
    });

    test('one initials circle of each color reaches 4.5:1', async ({ page }) => {
      await openList(page);
      const circles = await page
        .locator('.ag-row:has(a) [col-id="name"] span[aria-hidden="true"]')
        .evaluateAll((elements) =>
          elements.map((circle) => {
            const style = getComputedStyle(circle);
            const color = Array.from(circle.classList).find((name) => name.startsWith('bg-avatar'));
            return { color, text: style.color, fill: style.backgroundColor };
          }),
        );
      const byColor = new Map(circles.map((circle) => [circle.color, circle]));

      expect([...byColor.keys()].sort()).toEqual(
        [1, 2, 3, 4, 5, 6].map((index) => `bg-avatar-${index}-surface`),
      );
      for (const [color, circle] of byColor) {
        const ratio = await contrast(page, circle.text, circle.fill);
        console.log(`${colorScheme}: ${color} ${ratio.toFixed(2)}:1`);
        expect(ratio).toBeGreaterThanOrEqual(TEXT);
      }
    });

    test('role pills reach 4.5:1 on plain and striped rows', async ({ page }) => {
      await storeTableSettings(page, { striped: true });
      await openList(page);
      for (const row of ['ag-row-even', 'ag-row-odd']) {
        const pill = await pillColors(page, `.ag-row.${row}:has(a) [col-id="role"]`);
        const ratio = await contrast(page, pill.text, pill.fill);
        console.log(`${colorScheme}: role pill on ${row} ${ratio.toFixed(2)}:1`);
        expect(ratio).toBeGreaterThanOrEqual(TEXT);
      }
    });
  });
}

test('the card shadow takes its color from the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await openAbout(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const light = await cardShadow(page);

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await cardShadow(page);

  expect(light).not.toBe('none');
  expect(dark).not.toBe(light);
});
