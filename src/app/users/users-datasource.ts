import { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { toApiError, ApiError } from '../core/api/api-error';
import { PageRequest, UserPage } from '../core/api/user.model';

/** Hooks the grid's host uses to follow page loads. */
export interface UsersDatasourceEvents {
  loading(inFlight: boolean): void;
  loaded(total: number): void;
  failed(error: ApiError): void;
}

/**
 * Adapts page loading to AG Grid's Infinite Row Model. The grid asks for one block per page, so
 * each `getRows` call becomes one `skip`/`limit` request.
 */
export function createUsersDatasource(
  loadPage: (request: PageRequest) => Promise<UserPage>,
  events: UsersDatasourceEvents,
): IDatasource {
  return {
    getRows: async (params: IGetRowsParams) => {
      events.loading(true);
      try {
        const page = await loadPage({
          skip: params.startRow,
          limit: params.endRow - params.startRow,
        });
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
