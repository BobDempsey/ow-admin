import {
  Component,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  untracked,
} from '@angular/core';
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
import { ROW_HEIGHTS, TableSettingsService } from '../core/table-settings.service';
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

/**
 * Tailwind slate and sky values, so the grid matches the app's color tokens in styles.css. AG Grid
 * uses the dark set when `data-ag-theme-mode="dark"` is on `<html>`, which ThemeService sets.
 */
const usersGridTheme = themeQuartz
  .withParams({
    fontFamily: 'inherit',
    foregroundColor: '#0f172a',
    backgroundColor: '#ffffff',
    headerBackgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    accentColor: '#0369a1',
    // Quartz tints the focus ring to half opacity, which drops below 3:1 on the header.
    focusShadow: { radius: 0, spread: 3, color: '#0369a1' },
    headerHeight: 44,
  })
  .withParams(
    {
      foregroundColor: '#f1f5f9',
      backgroundColor: '#0f172a',
      headerBackgroundColor: '#1e293b',
      borderColor: '#334155',
      accentColor: '#38bdf8',
      focusShadow: { radius: 0, spread: 3, color: '#38bdf8' },
    },
    'dark',
  );

/**
 * The paged user grid. Each page is one block of the Infinite Row Model and one `GET /users`
 * request; only the current page is kept.
 */
@Component({
  selector: 'app-users-grid',
  imports: [AgGridAngular],
  host: { '(focusin)': 'revealFocus($event)', '[class.striped]': 'settings.striped()' },
  template: `
    <ag-grid-angular
      class="block w-full"
      [theme]="theme"
      [rowHeight]="initialRowHeight"
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
      [suppressMultiSort]="true"
      [overlayNoRowsTemplate]="noRowsTemplate"
      [suppressMovableColumns]="!settings.movableColumns()"
      [suppressDragLeaveHidesColumns]="true"
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
  protected readonly settings = inject(TableSettingsService);
  private api: GridApi<User> | undefined;

  /**
   * Rows have a fixed height per density, tall enough for two wrapped lines under WCAG text
   * spacing; the Infinite Row Model cannot size rows to their content.
   */
  private readonly rowHeight = computed(() => ROW_HEIGHTS[this.settings.density()]);
  protected readonly initialRowHeight = untracked(this.rowHeight);

  /** The committed search text. A change starts the list again from its first page. */
  readonly query = input('');

  constructor() {
    let previousQuery = untracked(this.query);
    effect(() => {
      const query = this.query();
      const api = this.api;
      if (api && query !== previousQuery) {
        api.purgeInfiniteCache();
        api.paginationGoToFirstPage();
      }
      previousQuery = query;
    });

    // A density change re-lays the current page. `resetRowHeights` needs an Enterprise module,
    // so the page is requested again at the new height instead, quietly since the rows stay put.
    // The datasource stays quiet only for that same request, so a page change merged into the
    // debounced load still shows loading.
    effect(() => {
      const height = this.rowHeight();
      const api = this.api;
      if (api && api.getGridOption('rowHeight') !== height) {
        api.setGridOption('rowHeight', height);
        this.datasource.quietNextLoad();
        api.refreshInfiniteCache();
      }
    });
  }

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
  /**
   * Every column sorts through the API, one at a time, cycling ascending, descending and unsorted;
   * a header sorts on click or Enter. Columns cannot be resized: that needs dragging in AG Grid
   * Community, and WCAG 2.5.7 asks for a way that does not. Columns flex to fill the width instead.
   */
  protected readonly defaultColDef: ColDef<User> = {
    sortable: true,
    sortingOrder: ['asc', 'desc', null],
    filter: false,
    resizable: false,
  };
  protected readonly noRowsTemplate = '<span>No users match your search.</span>';

  /**
   * AG Grid moves focus to some of its controls, such as Page Size, without scrolling them into
   * view (WCAG 2.4.11). `nearest` leaves an already visible element where it is.
   */
  protected revealFocus(event: FocusEvent): void {
    if (event.target instanceof HTMLElement) {
      event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  /**
   * Tab leaves the grid instead of stepping through every cell, so the grid is one tab stop and
   * the pagination controls are reachable. Arrow keys move between cells.
   */
  protected readonly leaveGridOnTab = () => false as const;
  protected readonly datasource = createUsersDatasource(
    (request) => this.users.loadPage(request),
    {
      loading: (inFlight) => this.loadingChange.emit(inFlight),
      loaded: (total) => this.loaded.emit(total),
      failed: (error) => this.failed.emit(error),
    },
    () => untracked(this.query),
  );

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
