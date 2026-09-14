import { IGetRowsParams } from 'ag-grid-community';
import { ApiError } from '../core/api/api-error';
import { seedUser } from '../core/api/in-memory/user-seed';
import { PageRequest, UserPage } from '../core/api/user.model';
import { UsersDatasourceEvents, createUsersDatasource } from './users-datasource';

function rowsParams(startRow: number, endRow: number) {
  return {
    startRow,
    endRow,
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    sortModel: [],
    filterModel: {},
  } as unknown as IGetRowsParams & {
    successCallback: ReturnType<typeof vi.fn>;
    failCallback: ReturnType<typeof vi.fn>;
  };
}

function trackEvents() {
  const calls: string[] = [];
  const events: UsersDatasourceEvents = {
    loading: (inFlight) => calls.push(`loading:${inFlight}`),
    loaded: (total) => calls.push(`loaded:${total}`),
    failed: (error) => calls.push(`failed:${error.status}`),
  };
  return { calls, events };
}

describe('createUsersDatasource', () => {
  it('requests the block as one skip/limit page and reports the total', async () => {
    const page: UserPage = { items: [seedUser(50), seedUser(51)], total: 500_000 };
    const loadPage = vi.fn((_request: PageRequest) => Promise.resolve(page));
    const { calls, events } = trackEvents();
    const params = rowsParams(50, 75);

    await createUsersDatasource(loadPage, events).getRows(params);

    expect(loadPage).toHaveBeenCalledExactlyOnceWith({ skip: 50, limit: 25 });
    expect(params.successCallback).toHaveBeenCalledWith(page.items, 500_000);
    expect(params.failCallback).not.toHaveBeenCalled();
    expect(calls).toEqual(['loading:true', 'loaded:500000', 'loading:false']);
  });

  it('fails the block and reports the ApiError when the page request fails', async () => {
    const loadPage = vi.fn(() => Promise.reject(new ApiError(500, 'Server error')));
    const { calls, events } = trackEvents();
    const params = rowsParams(0, 25);

    await createUsersDatasource(loadPage, events).getRows(params);

    expect(params.failCallback).toHaveBeenCalledOnce();
    expect(params.successCallback).not.toHaveBeenCalled();
    expect(calls).toEqual(['loading:true', 'failed:500', 'loading:false']);
  });
});
