import { TestBed } from '@angular/core/testing';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { API_LATENCY_MS } from '../core/api/api-config';
import { provideUsersApi } from '../core/api/provide-users-api';
import { User } from '../core/api/user.model';
import { ListQuery } from './users-datasource';
import { UsersGrid } from './users-grid';

/** The grid API calls the component makes outside the template. */
function stubGridApi() {
  const options = new Map<string, unknown>([['rowHeight', 64]]);
  return {
    purgeInfiniteCache: vi.fn(),
    paginationGoToFirstPage: vi.fn(),
    refreshInfiniteCache: vi.fn(),
    setGridOption: vi.fn((name: string, value: unknown) => options.set(name, value)),
    getGridOption: vi.fn((name: string) => options.get(name)),
  };
}

/**
 * Renders the component without AG Grid, which is not exercised in jsdom, and hands it a stub grid
 * API the way `gridReady` would.
 */
async function renderGrid(query: ListQuery) {
  TestBed.configureTestingModule({
    providers: [provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
  });
  TestBed.overrideComponent(UsersGrid, { set: { template: '' } });
  const fixture = TestBed.createComponent(UsersGrid);
  fixture.componentRef.setInput('query', query);
  await fixture.whenStable();

  const api = stubGridApi();
  const component = fixture.componentInstance as unknown as {
    onGridReady(event: GridReadyEvent<User>): void;
  };
  component.onGridReady({ api: api as unknown as GridApi<User> } as GridReadyEvent<User>);
  await fixture.whenStable();

  const setQuery = async (next: ListQuery) => {
    fixture.componentRef.setInput('query', next);
    await fixture.whenStable();
  };
  return { api, setQuery };
}

describe('UsersGrid', () => {
  it('leaves the cache and the page alone for an equal new query object', async () => {
    const { api, setQuery } = await renderGrid({ q: 'hopper', role: 'Admin' });

    await setQuery({ q: 'hopper', role: 'Admin' });

    expect(api.purgeInfiniteCache).not.toHaveBeenCalled();
    expect(api.paginationGoToFirstPage).not.toHaveBeenCalled();
  });

  it('starts again from the first page when a field changes', async () => {
    const { api, setQuery } = await renderGrid({ q: 'hopper', role: 'Admin' });

    await setQuery({ q: 'hopper', role: 'Admin', status: 'active' });
    await setQuery({ q: 'hopper', status: 'active' });
    await setQuery({ q: '', status: 'active' });

    expect(api.purgeInfiniteCache).toHaveBeenCalledTimes(3);
    expect(api.paginationGoToFirstPage).toHaveBeenCalledTimes(3);
  });
});
