import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { seedUser } from '../core/api/in-memory/user-seed';
import { User } from '../core/api/user.model';
import { UserActionsCell } from './user-actions-cell';
import { UsersGridContext } from './users-grid-context';

async function renderCell(data: User | undefined, rowIndex = 3) {
  const actionsOpenFor = signal<string | undefined>(undefined);
  const context: UsersGridContext = {
    loading: signal(false),
    actionsOpenFor,
    toggleActions: vi.fn(),
  };
  const fixture = TestBed.createComponent(UserActionsCell);
  fixture.componentInstance.agInit({
    data,
    node: { rowIndex },
    context,
  } as unknown as ICellRendererParams<User, unknown, UsersGridContext>);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  return { fixture, element, context, actionsOpenFor };
}

const radia: User = { ...seedUser(42), name: 'Radia Lamport' };

describe('UserActionsCell', () => {
  it('names the button for its user and marks it as opening a collapsed menu', async () => {
    const { element } = await renderCell(radia);
    const button = element.querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe('Actions for Radia Lamport');
    expect(button?.getAttribute('aria-haspopup')).toBe('menu');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the button out of the Tab order, so the grid stays one Tab stop', async () => {
    const { element } = await renderCell(radia);

    expect(element.querySelector('button')?.getAttribute('tabindex')).toBe('-1');
  });

  it('reports expanded while its own row menu is open', async () => {
    const { fixture, element, actionsOpenFor } = await renderCell(radia);

    actionsOpenFor.set(radia.id);
    await fixture.whenStable();
    expect(element.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');

    actionsOpenFor.set('u-000001');
    await fixture.whenStable();
    expect(element.querySelector('button')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('asks the grid to toggle the menu with its user, button and row on click', async () => {
    const { element, context } = await renderCell(radia, 7);
    const button = element.querySelector('button')!;

    button.click();

    expect(context.toggleActions).toHaveBeenCalledWith(radia, button, 7);
  });

  it('renders nothing while the row is loading', async () => {
    const { element } = await renderCell(undefined);

    expect(element.querySelector('button')).toBeNull();
  });
});
