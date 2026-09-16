import { TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { seedUser } from '../core/api/in-memory/user-seed';
import { USER_STATUSES, User, UserStatus } from '../core/api/user.model';
import { PillKind, UserPillCell, UserPillCellParams } from './user-pill-cell';

async function renderCell(kind: PillKind, data: User | undefined) {
  const fixture = TestBed.createComponent(UserPillCell);
  fixture.componentInstance.agInit({ data, kind } as ICellRendererParams<User> &
    UserPillCellParams);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const withStatus = (status: UserStatus): User => ({ ...seedUser(1), status });

describe('UserPillCell', () => {
  it.each([
    ['active', ['bg-status-active-surface', 'text-status-active-ink', 'border-status-active-line']],
    [
      'invited',
      ['bg-status-invited-surface', 'text-status-invited-ink', 'border-status-invited-line'],
    ],
    [
      'suspended',
      ['bg-status-suspended-surface', 'text-status-suspended-ink', 'border-status-suspended-line'],
    ],
  ] as const)('shows %s as a pill holding the word in its own colors', async (status, classes) => {
    const element = await renderCell('status', withStatus(status));
    const pill = element.querySelector('span');

    expect(pill?.textContent?.trim()).toBe(status);
    expect(Array.from(pill?.classList ?? [])).toEqual(
      expect.arrayContaining(['rounded-full', 'border', 'whitespace-nowrap', ...classes]),
    );
  });

  it('gives every status a different fill', async () => {
    const fills = await Promise.all(
      USER_STATUSES.map(async (status) => {
        const element = await renderCell('status', withStatus(status));
        return Array.from(element.querySelector('span')!.classList).find((name) =>
          name.startsWith('bg-'),
        );
      }),
    );

    expect(new Set(fills).size).toBe(USER_STATUSES.length);
  });

  it('shows the role in the neutral pill', async () => {
    const user: User = { ...seedUser(1), role: 'Viewer' };
    const element = await renderCell('role', user);
    const pill = element.querySelector('span');

    expect(pill?.textContent?.trim()).toBe('Viewer');
    expect(Array.from(pill?.classList ?? [])).toEqual(
      expect.arrayContaining(['rounded-full', 'bg-surface-muted', 'text-ink-muted', 'border-line']),
    );
  });

  it('renders nothing while the row is loading', async () => {
    const element = await renderCell('status', undefined);

    expect(element.querySelector('span')).toBeNull();
    expect(element.textContent?.trim()).toBe('');
  });
});
