import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ICellRendererParams } from 'ag-grid-community';
import { seedUser } from '../core/api/in-memory/user-seed';
import { User } from '../core/api/user.model';
import { UserNameCell } from './user-name-cell';

async function renderCell(data: User | undefined) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(UserNameCell);
  fixture.componentInstance.agInit({ data } as ICellRendererParams<User>);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('UserNameCell', () => {
  it('links the user name to the user detail screen', async () => {
    const user = seedUser(1);
    const element = await renderCell(user);
    const link = element.querySelector('a');

    expect(link?.textContent?.trim()).toBe(user.name);
    expect(link?.getAttribute('href')).toBe(`/users/${user.id}`);
  });

  it('shows the initials in a colored circle hidden from assistive technology', async () => {
    const user: User = { ...seedUser(42), id: 'u-000042', name: 'Radia Lamport' };
    const element = await renderCell(user);
    const circle = element.querySelector('span[aria-hidden="true"]');

    expect(circle?.textContent?.trim()).toBe('RL');
    // u-000042 sums to 456, the first of the six colors.
    expect(circle?.classList).toContain('bg-avatar-1-surface');
    expect(circle?.classList).toContain('text-avatar-1-ink');
    expect(circle?.classList).toContain('rounded-full');
    expect(circle?.nextElementSibling?.querySelector('a')).not.toBeNull();
  });

  it('keeps the link name to the user name alone', async () => {
    const user: User = { ...seedUser(42), name: 'Radia Lamport' };
    const element = await renderCell(user);

    expect(element.querySelector('a')?.textContent?.trim()).toBe('Radia Lamport');
    expect(element.querySelector('a span')).toBeNull();
  });

  it('renders nothing while the row is loading', async () => {
    const element = await renderCell(undefined);

    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('span')).toBeNull();
  });
});
