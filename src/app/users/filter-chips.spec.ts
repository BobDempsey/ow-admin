import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { FilterChip, FilterChipRemoval, FilterChips } from './filter-chips';

const CHIPS: FilterChip[] = [
  { key: 'search', label: 'Search: hopper' },
  { key: 'role', label: 'Role: Admin' },
  { key: 'status', label: 'Status: suspended' },
];

async function renderChips(chips: FilterChip[]) {
  const fixture = TestBed.createComponent(FilterChips);
  fixture.componentRef.setInput('chips', chips);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const chipButtons = () => Array.from(element.querySelectorAll<HTMLButtonElement>('ul button'));
  const clearAll = () =>
    Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Clear all',
    );
  return { fixture, element, chipButtons, clearAll };
}

const text = (element: Element) => element.textContent?.replace(/\s+/g, ' ').trim();

describe('FilterChips', () => {
  it('shows each chip label in a list named Active filters, then Clear all', async () => {
    const { element, chipButtons, clearAll } = await renderChips(CHIPS);
    const list = element.querySelector('ul');

    expect(list?.getAttribute('aria-label')).toBe('Active filters');
    expect(chipButtons().map(text)).toEqual([
      'Remove filter Search: hopper',
      'Remove filter Role: Admin',
      'Remove filter Status: suspended',
    ]);
    expect(clearAll()).toBeDefined();
    expect(list?.compareDocumentPosition(clearAll()!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('hides "Remove filter" and the icon visually, keeping the label visible', async () => {
    const { chipButtons } = await renderChips(CHIPS);
    const chip = chipButtons()[1];

    expect(chip.querySelector('.sr-only')?.textContent).toBe('Remove filter ');
    expect(chip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('emits the key and index of an activated chip', async () => {
    const { fixture, chipButtons } = await renderChips(CHIPS);
    const removed: FilterChipRemoval[] = [];
    fixture.componentInstance.remove.subscribe((removal) => removed.push(removal));

    chipButtons()[1].click();

    expect(removed).toEqual([{ key: 'role', index: 1 }]);
  });

  it('emits clearAll from Clear all', async () => {
    const { fixture, clearAll } = await renderChips(CHIPS);
    const cleared = vi.fn();
    fixture.componentInstance.clearAll.subscribe(cleared);

    clearAll()?.click();

    expect(cleared).toHaveBeenCalledOnce();
  });

  it('renders nothing with no chips', async () => {
    const { element, fixture } = await renderChips([]);

    expect(element.children).toHaveLength(0);
    expect(fixture.componentInstance.focusChip(0)).toBe(false);
  });

  it('focuses the chip at an index, or the last one past the end', async () => {
    const { fixture, chipButtons } = await renderChips(CHIPS.slice(0, 2));

    expect(fixture.componentInstance.focusChip(0)).toBe(true);
    expect(document.activeElement).toBe(chipButtons()[0]);
    expect(fixture.componentInstance.focusChip(5)).toBe(true);
    expect(document.activeElement).toBe(chipButtons()[1]);
  });

  it('has no axe violations', async () => {
    const { element } = await renderChips(CHIPS);

    await expectNoAxeViolations(element);
  });
});
