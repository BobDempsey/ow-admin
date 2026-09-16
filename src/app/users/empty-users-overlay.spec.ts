import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { EmptyUsersOverlay } from './empty-users-overlay';

async function render(filtered: boolean) {
  const fixture = TestBed.createComponent(EmptyUsersOverlay);
  fixture.componentRef.setInput('filtered', filtered);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim();
  return { fixture, element, text };
}

describe('EmptyUsersOverlay', () => {
  it('offers Clear filters when a search or filter matched nothing', async () => {
    const { element, text } = await render(true);

    expect(text('h2')).toBe('No users match');
    expect(text('p')).toBe('Try a different search or filter, or clear them to see every user.');
    expect(text('button')).toBe('Clear filters');
    expect(element.querySelector('button')?.getAttribute('type')).toBe('button');
  });

  it('says the list is empty, with no button, when nothing is filtered', async () => {
    const { element, text } = await render(false);

    expect(text('h2')).toBe('No users yet');
    expect(text('p')).toBe('Create a user to see them here.');
    expect(element.querySelector('button')).toBeNull();
  });

  it('emits clearFilters from the button', async () => {
    const { fixture, element } = await render(true);
    const cleared = vi.fn();
    fixture.componentInstance.clearFilters.subscribe(cleared);

    element.querySelector('button')?.click();

    expect(cleared).toHaveBeenCalledOnce();
  });

  it.each([true, false])('has no axe violations when filtered is %s', async (filtered) => {
    const { element } = await render(filtered);

    await expectNoAxeViolations(element);
  });
});
