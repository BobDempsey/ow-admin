import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

/** The axe rule tags for WCAG 2.0, 2.1 and 2.2 at levels A and AA. */
export const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Lists axe's WCAG A and AA violations on the page as `rule: selector, selector` lines. */
export async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

/** Fails with a readable list when axe finds any WCAG A or AA violation, color contrast included. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  expect(await axeViolations(page)).toEqual([]);
}
