import {
  Component,
  DestroyRef,
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
import { UserPillCell, UserPillCellParams } from './user-pill-cell';
import {
  EMPTY_LIST_QUERY,
  ListQuery,
  createUsersDatasource,
  sameListQuery,
} from './users-datasource';
import { UsersService } from './users.service';

// Registered here, not in app.config.ts, so AG Grid ships only in the lazy /users chunk.
ModuleRegistry.registerModules([
  InfiniteRowModelModule,
  PaginationModule,
  ...(isDevMode() ? [ValidationModule] : []),
]);

const DEFAULT_PAGE_SIZE = 25;

/**
 * The space the heading, description, the card's filter row and status line, and the page padding
 * take above and below the grid.
 */
const GRID_HEIGHT_OFFSET = '21.5rem';

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
    // The list's card draws the edge and rounds the corners, so the grid sits flush inside it.
    wrapperBorder: false,
    wrapperBorderRadius: 0,
  })
  .withParams(
    {
      foregroundColor: '#f1f5f9',
      backgroundColor: '#0f172a',
      headerBackgroundColor: '#1e293b',
      borderColor: '#334155',
      accentColor: '#38bdf8',
      focusShadow: { radius: 0, spread: 3, color: '#38bdf8' },
      wrapperBorder: false,
      wrapperBorderRadius: 0,
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
  host: {
    '(focusin)': 'revealFocus($event)',
    '[class.striped]': 'settings.striped()',
    '[style.height]': 'hostHeight()',
  },
  template: `
    <ag-grid-angular
      class="block h-full w-full"
      [theme]="theme"
      [rowHeight]="initialRowHeight"
      rowModelType="infinite"
      [datasource]="datasource"
      [columnDefs]="columnDefs"
      [defaultColDef]="initialDefaultColDef"
      [pagination]="true"
      [paginationPageSize]="defaultPageSize"
      [paginationPageSizeSelector]="pageSizes"
      [cacheBlockSize]="defaultPageSize"
      [maxBlocksInCache]="1"
      [blockLoadDebounceMillis]="50"
      [domLayout]="initialDomLayout"
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
  private readonly destroyRef = inject(DestroyRef);
  protected readonly settings = inject(TableSettingsService);
  private api: GridApi<User> | undefined;

  /**
   * Rows have a fixed height per density, tall enough for two wrapped lines under WCAG text
   * spacing; the Infinite Row Model cannot size rows to their content.
   */
  private readonly rowHeight = computed(() => ROW_HEIGHTS[this.settings.density()]);
  protected readonly initialRowHeight = untracked(this.rowHeight);

  /**
   * With Fixed header on the grid takes a bounded height and scrolls its rows under a header that
   * never moves; the offset is the space above and below the grid at 1280 px, and the floor keeps a
   * few rows visible at 400 percent zoom, where the page scrolls instead.
   */
  protected readonly hostHeight = computed(() =>
    this.settings.fixedHeader() ? `max(20rem, calc(100dvh - ${GRID_HEIGHT_OFFSET}))` : null,
  );
  private readonly domLayout = computed<'autoHeight' | 'normal'>(() =>
    this.settings.fixedHeader() ? 'normal' : 'autoHeight',
  );
  protected readonly initialDomLayout = untracked(this.domLayout);

  /**
   * The committed search and filters. A change starts the list again from its first page; an equal
   * object is compared field by field, so rebuilding it leaves the cache and the page alone.
   */
  readonly query = input<ListQuery>(EMPTY_LIST_QUERY);

  constructor() {
    let previousQuery = untracked(this.query);
    effect(() => {
      const query = this.query();
      const api = this.api;
      if (api && !sameListQuery(query, previousQuery)) {
        api.purgeInfiniteCache();
        api.paginationGoToFirstPage();
      }
      previousQuery = query;
    });

    // `defaultColDef` and `domLayout` are not reactive through the template, so a change to either
    // setting is pushed onto the live grid.
    effect(() => {
      const defaultColDef = this.defaultColDef();
      const domLayout = this.domLayout();
      const api = this.api;
      if (api) {
        api.setGridOption('defaultColDef', defaultColDef);
        api.setGridOption('domLayout', domLayout);
      }
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
    {
      field: 'role',
      headerName: 'Role',
      cellRenderer: UserPillCell,
      cellRendererParams: { kind: 'role' } satisfies UserPillCellParams,
      width: 120,
      minWidth: 120,
    },
    // 140 px keeps "suspended" on one line inside its pill under WCAG text spacing.
    {
      field: 'status',
      headerName: 'Status',
      cellRenderer: UserPillCell,
      cellRendererParams: { kind: 'status' } satisfies UserPillCellParams,
      width: 140,
      minWidth: 140,
    },
  ];
  /**
   * Every column sorts through the API, one at a time, cycling ascending, descending and unsorted;
   * a header sorts on click or Enter. Resizing is off unless the admin turns on Resizable columns,
   * since AG Grid Community resizes by dragging a header edge or with Alt and an arrow key, and
   * WCAG 2.5.7 asks for a single-pointer way. Columns flex to fill the width until one is resized.
   */
  private readonly defaultColDef = computed<ColDef<User>>(() => ({
    sortable: true,
    sortingOrder: ['asc', 'desc', null],
    filter: false,
    resizable: this.settings.resizableColumns(),
  }));
  protected readonly initialDefaultColDef = untracked(this.defaultColDef);
  protected readonly noRowsTemplate = '<span>No users match your search or filters.</span>';

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
      loading: (inFlight) => this.emitWhileActive(() => this.loadingChange.emit(inFlight)),
      loaded: (total) => this.emitWhileActive(() => this.loaded.emit(total)),
      failed: (error) => this.emitWhileActive(() => this.failed.emit(error)),
    },
    () => untracked(this.query),
  );

  /**
   * A page request can settle after the admin leaves the list, and emitting on a destroyed output
   * logs NG0953 in dev builds, so a settled load reports nothing once the grid is gone.
   */
  private emitWhileActive(emit: () => void): void {
    if (!this.destroyRef.destroyed) {
      emit();
    }
  }

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
