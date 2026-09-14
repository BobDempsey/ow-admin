import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe-core against a rendered element and fails with a readable list of violations.
 * jsdom has no layout, so `color-contrast` is disabled here and checked in the browser instead.
 */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  const results = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`,
  );
  expect(violations).toEqual([]);
}
