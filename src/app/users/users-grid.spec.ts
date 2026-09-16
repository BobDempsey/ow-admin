import { TestBed } from '@angular/core/testing';
import {
  CellKeyDownEvent,
  ColDef,
  Column,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IGetRowsParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { API_LATENCY_MS } from '../core/api/api-config';
import { seedUser } from '../core/api/in-memory/user-seed';
import { provideUsersApi } from '../core/api/provide-users-api';
import { User, UserPage } from '../core/api/user.model';
import { ListQuery, UsersDatasource } from './users-datasource';
import { SkeletonCell } from './skeleton-cell';
import { UserActionsCell } from './user-actions-cell';
import { UserNameCell } from './user-name-cell';
import { UserPillCell } from './user-pill-cell';
import { UsersGrid } from './users-grid';
import { UsersGridContext } from './users-grid-context';
import { UsersService } from './users.service';

/** The grid API calls the component makes outside the template. */
function stubGridApi() {
  const options = new Map<string, unknown>([['rowHeight', 64]]);
  return {
    purgeInfiniteCache: vi.fn(),
    paginationGoToFirstPage: vi.fn(),
    refreshInfiniteCache: vi.fn(),
    setGridOption: vi.fn((name: string, value: unknown) => options.set(name, value)),
    getGridOption: vi.fn((name: string) => options.get(name)),
    paginationGetPageSize: vi.fn(() => 25),
    paginationGetCurrentPage: vi.fn(() => 1),
    getDisplayedRowAtIndex: vi.fn((index: number) =>
      index >= 25 && index < 50 ? { data: seedUser(index) } : undefined,
    ),
    ensureIndexVisible: vi.fn(),
    setFocusedCell: vi.fn(),
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
  return { api, fixture, setQuery };
}

const columnDefs = (fixture: Awaited<ReturnType<typeof renderGrid>>['fixture']) =>
  (fixture.componentInstance as unknown as { columnDefs: ColDef<User>[] }).columnDefs;

/** The grid's protected handlers and state the row Actions tests drive. */
interface GridInternals {
  context: UsersGridContext;
  actions(): { user: User; anchor: HTMLElement; rowIndex: number } | undefined;
  onCellKeyDown(event: CellKeyDownEvent<User>): void;
  onRowClicked(event: RowClickedEvent<User>): void;
}

/** A focused grid cell holding a button, as AG Grid renders the Actions cell. */
function actionsCell() {
  const cell = document.createElement('div');
  cell.className = 'ag-cell';
  const button = document.createElement('button');
  cell.append(button);
  return { cell, button };
}

function keyOnCell(colId: string, key: string, target: Element, rowIndex = 27) {
  const keyboardEvent = new KeyboardEvent('keydown', { key, cancelable: true });
  Object.defineProperty(keyboardEvent, 'target', { value: target });
  return {
    keyboardEvent,
    event: {
      data: seedUser(rowIndex),
      rowIndex,
      column: { getColId: () => colId } as Column,
      event: keyboardEvent,
    } as unknown as CellKeyDownEvent<User>,
  };
}

describe('UsersGrid row actions', () => {
  it('adds an Actions column locked last, which neither sorts nor resizes', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const columns = columnDefs(fixture);

    expect(columns.at(-1)).toMatchObject({
      colId: 'actions',
      headerName: 'Actions',
      cellRenderer: UserActionsCell,
      sortable: false,
      resizable: false,
      lockPosition: 'right',
    });
  });

  it.each(['Enter', ' '])(
    'opens the menu with %j on the Actions cell, not the user',
    async (key) => {
      const { fixture } = await renderGrid({ q: '' });
      const grid = fixture.componentInstance as unknown as GridInternals;
      const opened = vi.fn();
      fixture.componentInstance.openUser.subscribe(opened);
      const { cell, button } = actionsCell();
      const { event, keyboardEvent } = keyOnCell('actions', key, cell);

      grid.onCellKeyDown(event);

      expect(opened).not.toHaveBeenCalled();
      expect(keyboardEvent.defaultPrevented).toBe(true);
      expect(grid.actions()).toEqual({ user: seedUser(27), anchor: button, rowIndex: 27 });
      expect(grid.context.actionsOpenFor()).toBe(seedUser(27).id);
    },
  );

  it('still opens the user with Enter on any other cell', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as GridInternals;
    const opened = vi.fn();
    fixture.componentInstance.openUser.subscribe(opened);
    const { event } = keyOnCell('email', 'Enter', document.createElement('div'));

    grid.onCellKeyDown(event);

    expect(opened).toHaveBeenCalledWith(seedUser(27).id);
    expect(grid.actions()).toBeUndefined();
  });

  it('ignores Space on other cells', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as GridInternals;
    const opened = vi.fn();
    fixture.componentInstance.openUser.subscribe(opened);

    grid.onCellKeyDown(keyOnCell('name', ' ', document.createElement('div')).event);

    expect(opened).not.toHaveBeenCalled();
    expect(grid.actions()).toBeUndefined();
  });

  it('opens nothing for a row click on the Actions button', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as GridInternals;
    const opened = vi.fn();
    fixture.componentInstance.openUser.subscribe(opened);
    const { button } = actionsCell();

    grid.onRowClicked({
      data: seedUser(27),
      event: { target: button },
    } as unknown as RowClickedEvent<User>);

    expect(opened).not.toHaveBeenCalled();
  });

  it('toggles the menu from the button through the cell context', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as GridInternals;
    const { button } = actionsCell();

    grid.context.toggleActions(seedUser(27), button, 27);
    expect(grid.actions()?.user).toEqual(seedUser(27));
    grid.context.toggleActions(seedUser(27), button, 27);
    expect(grid.actions()).toBeUndefined();
  });

  it('focuses an Actions cell on the current page', async () => {
    const { api, fixture } = await renderGrid({ q: '' });

    expect(fixture.componentInstance.focusActionsCell(27, seedUser(27).id)).toBe(true);
    expect(api.setFocusedCell).toHaveBeenCalledWith(27, 'actions');
  });

  it('reports false for a row off the current page or holding another user', async () => {
    const { api, fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance;

    expect(grid.focusActionsCell(3)).toBe(false);
    expect(grid.focusActionsCell(60)).toBe(false);
    expect(grid.focusActionsCell(27, 'u-999999')).toBe(false);
    expect(api.setFocusedCell).not.toHaveBeenCalled();
  });
});

describe('UsersGrid', () => {
  it('draws skeleton cells only for rows whose page has not answered', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as { initialDefaultColDef: ColDef<User> };
    const select = grid.initialDefaultColDef.cellRendererSelector!;

    expect(select({ data: undefined } as ICellRendererParams<User>)).toEqual({
      component: SkeletonCell,
    });
    expect(select({ data: seedUser(1) } as ICellRendererParams<User>)).toBeUndefined();
  });

  it('tells skeleton cells when a page request is in flight', async () => {
    const { fixture } = await renderGrid({ q: '' });
    let resolve: (page: UserPage) => void = () => undefined;
    vi.spyOn(TestBed.inject(UsersService), 'loadPage').mockReturnValue(
      new Promise((settle) => (resolve = settle)),
    );
    const grid = fixture.componentInstance as unknown as {
      context: UsersGridContext;
      datasource: UsersDatasource;
    };
    expect(grid.context.loading()).toBe(false);

    const load = grid.datasource.getRows({
      startRow: 0,
      endRow: 25,
      sortModel: [],
      filterModel: {},
      successCallback: vi.fn(),
      failCallback: vi.fn(),
    } as unknown as IGetRowsParams);
    expect(grid.context.loading()).toBe(true);

    resolve({ items: [], total: 0 });
    await load;
    expect(grid.context.loading()).toBe(false);
  });

  it('turns off its own no-rows overlay, since the page shows the empty state', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const grid = fixture.componentInstance as unknown as { suppressedOverlays: string[] };

    expect(grid.suppressedOverlays).toEqual(['noRows']);
  });

  it('renders the name with its initials circle, with room for both', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const name = columnDefs(fixture).find((column) => column.field === 'name');

    expect(name).toMatchObject({ cellRenderer: UserNameCell, minWidth: 220 });
  });

  it('shows role and status as pills, with room for "suspended"', async () => {
    const { fixture } = await renderGrid({ q: '' });
    const byField = new Map(columnDefs(fixture).map((column) => [column.field, column]));

    expect(byField.get('role')).toMatchObject({
      cellRenderer: UserPillCell,
      cellRendererParams: { kind: 'role' },
      minWidth: 120,
    });
    expect(byField.get('status')).toMatchObject({
      cellRenderer: UserPillCell,
      cellRendererParams: { kind: 'status' },
      width: 140,
      minWidth: 140,
    });
  });

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

  it('reports nothing when a page request settles after the grid is destroyed', async () => {
    const { fixture } = await renderGrid({ q: '' });
    let resolve: (page: UserPage) => void = () => undefined;
    vi.spyOn(TestBed.inject(UsersService), 'loadPage').mockReturnValue(
      new Promise((settle) => (resolve = settle)),
    );
    const warn = vi.spyOn(console, 'warn');
    const grid = fixture.componentInstance;
    const emitted = vi.fn();
    grid.loadingChange.subscribe(emitted);
    grid.loaded.subscribe(emitted);
    grid.failed.subscribe(emitted);
    const datasource = (grid as unknown as { datasource: UsersDatasource }).datasource;
    const params = {
      startRow: 0,
      endRow: 25,
      sortModel: [],
      filterModel: {},
      successCallback: vi.fn(),
      failCallback: vi.fn(),
    } as unknown as IGetRowsParams;

    const load = datasource.getRows(params);
    expect(emitted).toHaveBeenCalledWith(true);
    emitted.mockClear();
    fixture.destroy();
    resolve({ items: [], total: 0 });
    await load;

    expect(emitted).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
