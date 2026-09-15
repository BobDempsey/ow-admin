import { IDatasource, IGetRowsParams, SortModelItem } from 'ag-grid-community';
import { toApiError, ApiError } from '../core/api/api-error';
import { PageRequest, USER_SORT_FIELDS, UserPage, UserSort } from '../core/api/user.model';

/** Hooks the grid's host uses to follow page loads. */
export interface UsersDatasourceEvents {
  loading(inFlight: boolean): void;
  loaded(total: number): void;
  failed(error: ApiError): void;
}

/**
 * Adapts page loading to AG Grid's Infinite Row Model. The grid asks for one block per page, so
 * each `getRows` call becomes one `skip`/`limit` request, carrying the grid's sort and the current
 * search from `query`.
 */
export function createUsersDatasource(
  loadPage: (request: PageRequest) => Promise<UserPage>,
  events: UsersDatasourceEvents,
  query: () => string = () => '',
): IDatasource {
  return {
    getRows: async (params: IGetRowsParams) => {
      events.loading(true);
      try {
        const request: PageRequest = {
          skip: params.startRow,
          limit: params.endRow - params.startRow,
        };
        const sort = toUserSort(params.sortModel[0]);
        if (sort) {
          request.sort = sort;
        }
        const q = query().trim();
        if (q) {
          request.q = q;
        }
        const page = await loadPage(request);
        params.successCallback(page.items, page.total);
        events.loaded(page.total);
      } catch (error) {
        params.failCallback();
        events.failed(toApiError(error));
      } finally {
        events.loading(false);
      }
    },
  };
}

function toUserSort(item: SortModelItem | undefined): UserSort | undefined {
  const field = USER_SORT_FIELDS.find((candidate) => candidate === item?.colId);
  return field && item ? { field, direction: item.sort } : undefined;
}
