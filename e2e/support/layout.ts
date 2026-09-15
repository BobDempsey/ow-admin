import { Page } from '@playwright/test';

/** True when the page itself scrolls sideways (WCAG 1.4.10). Scroll boxes inside it do not count. */
export function scrollsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

/**
 * Presses Tab up to `maxStops` times, or until focus comes back to where it started, and returns a
 * description of every focused element that was entirely hidden: outside the viewport, or covered
 * by other content at its center and all four corners (WCAG 2.4.11).
 */
export async function obscuredFocusStops(page: Page, maxStops = 60): Promise<string[]> {
  const obscured: string[] = [];
  let first: string | undefined;
  for (let stop = 0; stop < maxStops; stop++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) {
        return { key: 'body', hidden: false };
      }
      const key = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''} "${(
        element.textContent ?? ''
      )
        .trim()
        .slice(0, 40)}"`;
      const rect = element.getBoundingClientRect();
      const inset = 1;
      const points = [
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
        [rect.left + inset, rect.top + inset],
        [rect.right - inset, rect.top + inset],
        [rect.left + inset, rect.bottom - inset],
        [rect.right - inset, rect.bottom - inset],
      ];
      const visible = points.some(([x, y]) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
          return false;
        }
        const hit = document.elementFromPoint(x, y);
        return !!hit && (hit === element || element.contains(hit) || hit.contains(element));
      });
      return { key, hidden: !visible };
    });
    if (result.key === first) {
      break;
    }
    first ??= result.key;
    if (result.hidden) {
      obscured.push(result.key);
    }
  }
  return obscured;
}

/**
 * Lists visible controls smaller than 24 by 24 CSS pixels (WCAG 2.5.8), for review against the
 * spacing and inline exceptions. Links inside a line of text are skipped as the inline exception.
 */
export function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const controls = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(controls)
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.visibility === 'hidden' || style.display === 'none') {
          return false;
        }
        if (element.tagName === 'A' && style.display === 'inline') {
          return false;
        }
        // Visually hidden controls (Tailwind's sr-only, such as the skip link before it has focus)
        // are not pointer targets.
        if (style.clipPath !== 'none' || style.clip !== 'auto') {
          return false;
        }
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const name = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40);
        return `${element.tagName.toLowerCase()}.${element.className} "${name}" ${Math.round(rect.width)}x${Math.round(rect.height)}`;
      });
  });
}

/** Applies the WCAG 1.4.12 text spacing values to every element. */
export async function applyTextSpacing(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `* {
      line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    p { margin-bottom: 2em !important; }`,
  });
}

/** Approximates 200 percent browser zoom (WCAG 1.4.4) by zooming the root element. */
export async function zoomTo200Percent(page: Page): Promise<void> {
  await page.addStyleTag({ content: 'html { zoom: 2; }' });
}

/**
 * Lists text that is cut off: each run of visible text is measured, and it counts as clipped when
 * it reaches past an ancestor that hides or clips its overflow, which is how text spacing and zoom
 * usually lose text (including ellipsis truncation). Visually hidden text is skipped.
 */
export function clippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const clipped: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const parent = node.parentElement;
      if (!text || !parent || getComputedStyle(parent).visibility === 'hidden') {
        continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) {
        continue;
      }
      for (let ancestor: HTMLElement | null = parent; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        // Visually hidden text (Tailwind's sr-only, AG Grid's live descriptions) is clipped on
        // purpose.
        if (style.clipPath !== 'none' || style.clip !== 'auto') {
          break;
        }
        // Content past a scroll container can be scrolled to, so it is not lost.
        if (
          ['auto', 'scroll'].includes(style.overflowX) ||
          ['auto', 'scroll'].includes(style.overflowY)
        ) {
          break;
        }
        const clipsX = ['hidden', 'clip'].includes(style.overflowX);
        const clipsY = ['hidden', 'clip'].includes(style.overflowY);
        if (!clipsX && !clipsY) {
          continue;
        }
        const bounds = ancestor.getBoundingClientRect();
        if (bounds.width <= 2 && bounds.height <= 2) {
          break;
        }
        const cutX = clipsX && (box.left < bounds.left - 1 || box.right > bounds.right + 1);
        const cutY = clipsY && (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1);
        if (cutX || cutY) {
          clipped.push(
            `"${text.slice(0, 40)}" cut by ${ancestor.tagName.toLowerCase()}.${ancestor.className}`,
          );
          break;
        }
      }
    }
    return clipped;
  });
}

/** Waits until no status region says something is loading, for example after a style change. */
export async function waitForLoaded(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('[role="status"]')).every(
      (status) => !status.textContent?.includes('Loading'),
    ),
  );
}
