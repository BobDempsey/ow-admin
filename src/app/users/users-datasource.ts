import { IDatasource, IGetRowsParams, SortModelItem } from 'ag-grid-community';
import { toApiError, ApiError } from '../core/api/api-error';
import {
  PageRequest,
  USER_SORT_FIELDS,
  UserPage,
  UserRole,
  UserSort,
  UserStatus,
} from '../core/api/user.model';

/** The search and filters the list is showing, carried together from the page to the request. */
export interface ListQuery {
  /** The committed search text. Blank means no search. */
  q: string;
  role?: UserRole;
  status?: UserStatus;
}

/** No search and no filters. */
export const EMPTY_LIST_QUERY: ListQuery = { q: '' };

/** Whether two list queries ask for the same users, so a rebuilt object is not a change. */
export function sameListQuery(a: ListQuery, b: ListQuery): boolean {
  return a.q === b.q && a.role === b.role && a.status === b.status;
}

/** Hooks the grid's host uses to follow page loads. */
export interface UsersDatasourceEvents {
  loading(inFlight: boolean): void;
  loaded(total: number): void;
  failed(error: ApiError): void;
}

/** The grid's datasource, plus a way to keep its next load from reporting loading. */
export interface UsersDatasource extends IDatasource {
  /**
   * Makes the next `getRows` call skip `loading` if it asks for the same request as the last one,
   * for a reload that keeps the rows on screen. It still reports `loaded` and `failed`. A request
   * merged with a page, sort, search or filter change differs, so it reports loading. The mark
   * clears when the next request starts.
   */
  quietNextLoad(): void;
}

/**
 * Adapts page loading to AG Grid's Infinite Row Model. The grid asks for one block per page, so
 * each `getRows` call becomes one `skip`/`limit` request, carrying the grid's sort and the current
 * search and filters from `query`.
 */
export function createUsersDatasource(
  loadPage: (request: PageRequest) => Promise<UserPage>,
  events: UsersDatasourceEvents,
  query: () => ListQuery = () => EMPTY_LIST_QUERY,
): UsersDatasource {
  let lastRequest: string | undefined;
  let quietRequest: string | undefined;
  return {
    quietNextLoad: () => {
      quietRequest = lastRequest;
    },
    getRows: async (params: IGetRowsParams) => {
      const request: PageRequest = {
        skip: params.startRow,
        limit: params.endRow - params.startRow,
      };
      const sort = toUserSort(params.sortModel[0]);
      if (sort) {
        request.sort = sort;
      }
      const { q, role, status } = query();
      if (q.trim()) {
        request.q = q.trim();
      }
      if (role) {
        request.role = role;
      }
      if (status) {
        request.status = status;
      }
      const key = JSON.stringify(request);
      const reportLoading = quietRequest !== key;
      lastRequest = key;
      quietRequest = undefined;
      if (reportLoading) {
        events.loading(true);
      }
      try {
        const page = await loadPage(request);
        params.successCallback(page.items, page.total);
        events.loaded(page.total);
      } catch (error) {
        params.failCallback();
        events.failed(toApiError(error));
      } finally {
        if (reportLoading) {
          events.loading(false);
        }
      }
    },
  };
}

function toUserSort(item: SortModelItem | undefined): UserSort | undefined {
  const field = USER_SORT_FIELDS.find((candidate) => candidate === item?.colId);
  return field && item ? { field, direction: item.sort } : undefined;
}
