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

  it('renders nothing while the row is loading', async () => {
    const element = await renderCell(undefined);

    expect(element.querySelector('a')).toBeNull();
  });
});
