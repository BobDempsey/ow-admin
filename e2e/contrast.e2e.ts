import { Page } from '@playwright/test';
import { expect, test } from './support/test';
import { COLOR_SCHEMES, openAbout } from './support/app';
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

/** The colors the header draws, read from its rendered elements. */
async function headerColors(page: Page) {
  const header = page.locator('header');
  const users = header.getByRole('link', { name: 'Users', exact: true });
  const placeholder = header.getByRole('button', { name: 'Reports (not available yet)' });
  const style = (locator: typeof users, property: string) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
  await expect(users).toHaveAttribute('aria-current', 'page');

  const surface = await style(header, 'background-color');
  const text = await style(users, 'color');
  const underline = await style(users, 'border-bottom-color');
  const placeholderText = await style(placeholder, 'color');
  await users.hover();
  const hover = await style(users, 'background-color');
  await page.mouse.move(0, 400);
  await users.focus();
  const focusRing = await style(users, 'outline-color');
  return { surface, text, underline, placeholderText, hover, focusRing };
}

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`header contrast, ${colorScheme} theme at 1280px`, () => {
    test.use({ colorScheme, viewport: { width: 1280, height: 900 } });

    test('text, placeholders, focus ring and underline meet their minimums', async ({ page }) => {
      await page.goto('/users');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      const colors = await headerColors(page);
      const ratios = {
        text: await contrast(page, colors.text, colors.surface),
        textOnHover: await contrast(page, colors.text, colors.hover),
        placeholder: await contrast(page, colors.placeholderText, colors.surface),
        focusRing: await contrast(page, colors.focusRing, colors.surface),
        underline: await contrast(page, colors.underline, colors.surface),
        underlineOnHover: await contrast(page, colors.underline, colors.hover),
      };
      console.log(`${colorScheme} header: ${JSON.stringify(ratios)}`);

      expect(colors.hover).not.toBe(colors.surface);
      expect(ratios.text).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.textOnHover).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.placeholder).toBeGreaterThanOrEqual(TEXT);
      expect(ratios.focusRing).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.underline).toBeGreaterThanOrEqual(NON_TEXT);
      expect(ratios.underlineOnHover).toBeGreaterThanOrEqual(NON_TEXT);
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
