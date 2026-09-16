import { Page } from '@playwright/test';

/** WCAG contrast ratio between two CSS colors, measured from what the browser renders. */
export function contrast(page: Page, foreground: string, background: string): Promise<number> {
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

/** The rendered value of a color token, read from a probe element in the page's current theme. */
export function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(--color-${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

/** The contrast between two color tokens in the page's current theme. */
export async function tokenContrast(page: Page, foreground: string, background: string) {
  return contrast(page, await tokenColor(page, foreground), await tokenColor(page, background));
}
