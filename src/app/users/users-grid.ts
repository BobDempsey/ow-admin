import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
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
  OverlayType,
  PaginationChangedEvent,
  PaginationModule,
  RowClickedEvent,
  ValidationModule,
  themeQuartz,
} from 'ag-grid-community';
import { ApiError } from '../core/api/api-error';
import { User } from '../core/api/user.model';
import { ROW_HEIGHTS, TableSettingsService } from '../core/table-settings.service';
import { RowActionsMenu, RowActionsMenuClose } from './row-actions-menu';
import { SkeletonCell } from './skeleton-cell';
import { UserActionsCell } from './user-actions-cell';
import { UserNameCell } from './user-name-cell';
import { UserPillCell, UserPillCellParams } from './user-pill-cell';
import {
  EMPTY_LIST_QUERY,
  ListQuery,
  createUsersDatasource,
  sameListQuery,
} from './users-datasource';
import { UsersGridContext } from './users-grid-context';
import { UsersService } from './users.service';

// Registered here, not in app.config.ts, so AG Grid ships only in the lazy /users chunk.
ModuleRegistry.registerModules([
  InfiniteRowModelModule,
  PaginationModule,
  ...(isDevMode() ? [ValidationModule] : []),
]);

const DEFAULT_PAGE_SIZE = 25;

/** A user row, found by where it sits in the whole list. */
export interface UserRowTarget {
  user: User;
  rowIndex: number;
}

/** The open Actions menu: its row and the button it belongs to. */
interface OpenActions extends UserRowTarget {
  anchor: HTMLElement;
}

/**
 * The space the heading, description, the card's filter row and status line, and the page padding
 * take above and below the grid.
 */
const GRID_HEIGHT_OFFSET = '19.5rem';

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
 * request; only the current page is kept. With five columns every cell is rendered, even off to
 * the side at 320 px, so the Actions button always exists for the pointer and for focus to return to.
 */
@Component({
  selector: 'app-users-grid',
  imports: [AgGridAngular, RowActionsMenu],
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
      [infiniteInitialRowCount]="defaultPageSize"
      [context]="context"
      [maxBlocksInCache]="1"
      [blockLoadDebounceMillis]="50"
      [domLayout]="initialDomLayout"
      [ensureDomOrder]="true"
      [suppressColumnVirtualisation]="true"
      [suppressMultiSort]="true"
      [suppressOverlays]="suppressedOverlays"
      [suppressMovableColumns]="!settings.movableColumns()"
      [suppressDragLeaveHidesColumns]="true"
      [tabToNextCell]="leaveGridOnTab"
      [tabToNextHeader]="leaveGridOnTab"
      (gridReady)="onGridReady($event)"
      (paginationChanged)="onPaginationChanged($event)"
      (rowClicked)="onRowClicked($event)"
      (cellKeyDown)="onCellKeyDown($event)"
    />
    @if (actions(); as open) {
      <app-row-actions-menu
        [user]="open.user"
        [anchor]="open.anchor"
        (resetPassword)="resetPassword.emit({ user: open.user, rowIndex: open.rowIndex })"
        (closed)="closeActions(open, $event)"
      />
    }
  `,
})
export class UsersGrid {
  private readonly users = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
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
  /** Reset password was chosen in a row's Actions menu. */
  readonly resetPassword = output<UserRowTarget>();

  protected readonly theme = usersGridTheme;
  protected readonly defaultPageSize = DEFAULT_PAGE_SIZE;
  protected readonly pageSizes = [25, 50, 100];
  protected readonly columnDefs: ColDef<User>[] = [
    // 220 px leaves room for the initials circle beside a two-line name.
    { field: 'name', headerName: 'Name', cellRenderer: UserNameCell, flex: 1, minWidth: 220 },
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
    // Locked last, so Draggable columns never moves it; its button opens the row's Actions menu.
    {
      colId: 'actions',
      headerName: 'Actions',
      cellRenderer: UserActionsCell,
      width: 104,
      minWidth: 104,
      sortable: false,
      resizable: false,
      lockPosition: 'right',
    },
  ];
  /**
   * Every column sorts through the API, one at a time, cycling ascending, descending and unsorted;
   * a header sorts on click or Enter. Resizing is off unless the admin turns on Resizable columns,
   * since AG Grid Community resizes by dragging a header edge or with Alt and an arrow key, and
   * WCAG 2.5.7 asks for a single-pointer way. Columns flex to fill the width until one is resized.
   * A row whose page has not answered draws skeleton bars in every column, whatever its renderer.
   */
  private readonly defaultColDef = computed<ColDef<User>>(() => ({
    sortable: true,
    sortingOrder: ['asc', 'desc', null],
    filter: false,
    resizable: this.settings.resizableColumns(),
    cellRendererSelector: (params) => (params.data ? undefined : { component: SkeletonCell }),
  }));
  protected readonly initialDefaultColDef = untracked(this.defaultColDef);
  /**
   * AG Grid's overlay turns pointer events off for everything inside it, so its no-rows overlay
   * could not hold a working Clear filters button. `UsersPage` shows the empty state instead.
   */
  protected readonly suppressedOverlays: OverlayType[] = ['noRows'];

  /**
   * AG Grid moves focus to some of its controls, such as Page Size, without scrolling them into
   * view (WCAG 2.4.11). `nearest` leaves an already visible element where it is.
   */
  protected revealFocus(event: FocusEvent): void {
    // The Actions menu is fixed on screen already, and scrolling would close it.
    if (event.target instanceof HTMLElement && !event.target.closest('app-row-actions-menu')) {
      event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  /**
   * Tab leaves the grid instead of stepping through every cell, so the grid is one tab stop and
   * the pagination controls are reachable. Arrow keys move between cells.
   */
  protected readonly leaveGridOnTab = () => false as const;
  /** Whether a request that shows loading is in flight; skeleton cells read it. */
  private readonly loading = signal(false);
  /** The row whose Actions menu is open. The menu is rendered after the grid, not in the row. */
  protected readonly actions = signal<OpenActions | undefined>(undefined);
  protected readonly context: UsersGridContext = {
    loading: this.loading.asReadonly(),
    actionsOpenFor: computed(() => this.actions()?.user.id),
    toggleActions: (user, anchor, rowIndex) => {
      this.actions.set(
        this.actions()?.user.id === user.id ? undefined : { user, anchor, rowIndex },
      );
    },
  };
  protected readonly datasource = createUsersDatasource(
    (request) => this.users.loadPage(request),
    {
      loading: (inFlight) => {
        this.loading.set(inFlight);
        this.emitWhileActive(() => this.loadingChange.emit(inFlight));
      },
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

  /**
   * Moves focus to a row's Actions cell. Returns false when that row is not on the current page, is
   * not rendered, or no longer holds the given user, so the caller can put focus somewhere else.
   *
   * The row is read from the rendered cells rather than through `getDisplayedRowAtIndex` and
   * `ensureIndexVisible`, whose API modules are not registered. `setFocusedCell` focuses the cell
   * without scrolling, and `revealFocus` then brings it into view.
   */
  focusActionsCell(rowIndex: number, userId?: string): boolean {
    const api = this.api;
    if (!api) {
      return false;
    }
    const pageSize = api.paginationGetPageSize();
    const firstRow = api.paginationGetCurrentPage() * pageSize;
    if (rowIndex < firstRow || rowIndex >= firstRow + pageSize) {
      return false;
    }
    const row = this.host.querySelector(`.ag-row[row-index="${rowIndex}"]`);
    if (!row?.querySelector('[col-id="actions"] button')) {
      return false;
    }
    if (userId && !row.querySelector(`[col-id="name"] a[href="/users/${userId}"]`)) {
      return false;
    }
    api.setFocusedCell(rowIndex, 'actions');
    return true;
  }

  protected closeActions(open: OpenActions, { returnFocus }: RowActionsMenuClose): void {
    if (this.actions() !== open) {
      return;
    }
    this.actions.set(undefined);
    if (returnFocus) {
      this.focusActionsCell(open.rowIndex, open.user.id);
    }
  }

  protected onGridReady(event: GridReadyEvent<User>): void {
    this.api = event.api;
  }

  protected onPaginationChanged(event: PaginationChangedEvent<User>): void {
    if (event.newPage) {
      this.actions.set(undefined);
    }
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
    // The name link navigates by itself, which keeps modifier and middle clicks working, and the
    // Actions button opens its menu instead of the user.
    if (!event.data || (target instanceof Element && target.closest('a, button'))) {
      return;
    }
    this.openUser.emit(event.data.id);
  }

  /**
   * Enter opens the user from any cell but Actions. On the Actions cell, Enter and Space open the
   * row's menu, which is how the keyboard reaches a button that is not a Tab stop.
   */
  protected onCellKeyDown(event: CellKeyDownEvent<User> | FullWidthCellKeyDownEvent<User>): void {
    const keyboardEvent = event.event;
    if (!event.data || !(keyboardEvent instanceof KeyboardEvent)) {
      return;
    }
    const onActions = 'column' in event && event.column.getColId() === 'actions';
    if (!onActions) {
      if (keyboardEvent.key === 'Enter') {
        this.openUser.emit(event.data.id);
      }
      return;
    }
    if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
      return;
    }
    keyboardEvent.preventDefault();
    const cell = keyboardEvent.target instanceof Element ? keyboardEvent.target : null;
    const button = cell?.closest('.ag-cell')?.querySelector('button');
    if (button && event.rowIndex !== null) {
      this.actions.set({ user: event.data, anchor: button, rowIndex: event.rowIndex });
    }
  }
}
