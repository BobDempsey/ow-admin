import { Component, inject, isDevMode, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellKeyDownEvent,
  ColDef,
  FullWidthCellKeyDownEvent,
  GridApi,
  GridReadyEvent,
  InfiniteRowModelModule,
  ModuleRegistry,
  PaginationChangedEvent,
  PaginationModule,
  RowClickedEvent,
  ValidationModule,
  themeQuartz,
} from 'ag-grid-community';
import { ApiError } from '../core/api/api-error';
import { User } from '../core/api/user.model';
import { UserNameCell } from './user-name-cell';
import { createUsersDatasource } from './users-datasource';
import { UsersService } from './users.service';

// Registered here, not in app.config.ts, so AG Grid ships only in the lazy /users chunk.
ModuleRegistry.registerModules([
  InfiniteRowModelModule,
  PaginationModule,
  ...(isDevMode() ? [ValidationModule] : []),
]);

const DEFAULT_PAGE_SIZE = 25;

/** Tailwind slate and sky values, so the grid matches the rest of the app. */
const usersGridTheme = themeQuartz.withParams({
  fontFamily: 'inherit',
  foregroundColor: '#0f172a',
  backgroundColor: '#ffffff',
  headerBackgroundColor: '#f8fafc',
  borderColor: '#e2e8f0',
  accentColor: '#0369a1',
  // Quartz tints the focus ring to half opacity, which drops below 3:1 on the header.
  focusShadow: { radius: 0, spread: 3, color: '#0369a1' },
  rowHeight: 44,
  headerHeight: 44,
});

/**
 * The paged user grid. Each page is one block of the Infinite Row Model and one `GET /users`
 * request; only the current page is kept.
 */
@Component({
  selector: 'app-users-grid',
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="block w-full"
      [theme]="theme"
      rowModelType="infinite"
      [datasource]="datasource"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [pagination]="true"
      [paginationPageSize]="defaultPageSize"
      [paginationPageSizeSelector]="pageSizes"
      [cacheBlockSize]="defaultPageSize"
      [maxBlocksInCache]="1"
      [blockLoadDebounceMillis]="50"
      domLayout="autoHeight"
      [ensureDomOrder]="true"
      [tabToNextCell]="leaveGridOnTab"
      [tabToNextHeader]="leaveGridOnTab"
      (gridReady)="onGridReady($event)"
      (paginationChanged)="onPaginationChanged($event)"
      (rowClicked)="onRowClicked($event)"
      (cellKeyDown)="onCellKeyDown($event)"
    />
  `,
})
export class UsersGrid {
  private readonly users = inject(UsersService);
  private api: GridApi<User> | undefined;

  readonly loadingChange = output<boolean>();
  readonly loaded = output<number>();
  readonly failed = output<ApiError>();
  readonly openUser = output<string>();

  protected readonly theme = usersGridTheme;
  protected readonly defaultPageSize = DEFAULT_PAGE_SIZE;
  protected readonly pageSizes = [25, 50, 100];
  protected readonly columnDefs: ColDef<User>[] = [
    { field: 'name', headerName: 'Name', cellRenderer: UserNameCell, flex: 1, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 240 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'status', headerName: 'Status', width: 130 },
  ];
  protected readonly defaultColDef: ColDef<User> = { sortable: false, filter: false };
  /**
   * Tab leaves the grid instead of stepping through every cell, so the grid is one tab stop and
   * the pagination controls are reachable. Arrow keys move between cells.
   */
  protected readonly leaveGridOnTab = () => false as const;
  protected readonly datasource = createUsersDatasource((request) => this.users.loadPage(request), {
    loading: (inFlight) => this.loadingChange.emit(inFlight),
    loaded: (total) => this.loaded.emit(total),
    failed: (error) => this.failed.emit(error),
  });

  /** Requests the current page again, for example after a failed load. */
  refresh(): void {
    this.api?.refreshInfiniteCache();
  }

  protected onGridReady(event: GridReadyEvent<User>): void {
    this.api = event.api;
  }

  protected onPaginationChanged(event: PaginationChangedEvent<User>): void {
    const api = this.api;
    if (!event.newPageSize || !api) {
      return;
    }
    // Keep one block per page, so the new size is still one request per page.
    api.setGridOption('cacheBlockSize', api.paginationGetPageSize());
    api.purgeInfiniteCache();
    api.paginationGoToFirstPage();
  }

  protected onRowClicked(event: RowClickedEvent<User>): void {
    const target = event.event?.target;
    // The name link navigates by itself, which keeps modifier and middle clicks working.
    if (!event.data || (target instanceof Element && target.closest('a'))) {
      return;
    }
    this.openUser.emit(event.data.id);
  }

  protected onCellKeyDown(event: CellKeyDownEvent<User> | FullWidthCellKeyDownEvent<User>): void {
    const keyboardEvent = event.event;
    if (event.data && keyboardEvent instanceof KeyboardEvent && keyboardEvent.key === 'Enter') {
      this.openUser.emit(event.data.id);
    }
  }
}
