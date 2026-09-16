import { DOCUMENT, Service, computed, inject, signal } from '@angular/core';
import { storageOf } from './browser-storage';

export const TABLE_DENSITIES = ['comfortable', 'compact'] as const;
export type TableDensity = (typeof TABLE_DENSITIES)[number];

/**
 * Row height per density. Compact still fits two wrapped lines of cell text under WCAG 1.4.12
 * text spacing (checked in e2e/grid.e2e.ts).
 */
export const ROW_HEIGHTS: Record<TableDensity, number> = { comfortable: 64, compact: 48 };

/** The localStorage key holding all table settings as one JSON object. */
export const TABLE_SETTINGS_STORAGE_KEY = 'orbweaver-admin-table-settings';

export interface TableSettings {
  striped: boolean;
  density: TableDensity;
  /** Lets columns be reordered by dragging a header. Fails WCAG 2.5.7, so it is off by default. */
  movableColumns: boolean;
  /** Lets column widths be changed by dragging a header edge. Also fails WCAG 2.5.7. */
  resizableColumns: boolean;
  /** Keeps the column header in view by scrolling the rows inside a grid of bounded height. */
  fixedHeader: boolean;
}

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  striped: false,
  density: 'compact',
  movableColumns: false,
  resizableColumns: false,
  fixedHeader: false,
};

/**
 * The user table's display settings. Each change applies at once and is remembered in the browser;
 * when storage is refused, changes last for the current page load.
 */
@Service()
export class TableSettingsService {
  private readonly storage = storageOf(inject(DOCUMENT).defaultView);
  private readonly settings = signal<TableSettings>(readSettings(this.storage));

  readonly striped = computed(() => this.settings().striped);
  readonly density = computed(() => this.settings().density);
  readonly movableColumns = computed(() => this.settings().movableColumns);
  readonly resizableColumns = computed(() => this.settings().resizableColumns);
  readonly fixedHeader = computed(() => this.settings().fixedHeader);

  update(changes: Partial<TableSettings>): void {
    this.settings.update((settings) => ({ ...settings, ...changes }));
    try {
      this.storage?.setItem(TABLE_SETTINGS_STORAGE_KEY, JSON.stringify(this.settings()));
    } catch {
      // Storage can be disabled or full; the setting still applies.
    }
  }
}

/** Reads stored settings, keeping each valid field and falling back to the default for the rest. */
function readSettings(storage: Storage | undefined): TableSettings {
  let stored: unknown;
  try {
    stored = JSON.parse(storage?.getItem(TABLE_SETTINGS_STORAGE_KEY) ?? 'null');
  } catch {
    return DEFAULT_TABLE_SETTINGS;
  }
  if (typeof stored !== 'object' || stored === null) {
    return DEFAULT_TABLE_SETTINGS;
  }
  const { striped, density, movableColumns, resizableColumns, fixedHeader } = stored as Record<
    string,
    unknown
  >;
  return {
    striped: typeof striped === 'boolean' ? striped : DEFAULT_TABLE_SETTINGS.striped,
    density: TABLE_DENSITIES.find((value) => value === density) ?? DEFAULT_TABLE_SETTINGS.density,
    movableColumns:
      typeof movableColumns === 'boolean' ? movableColumns : DEFAULT_TABLE_SETTINGS.movableColumns,
    resizableColumns:
      typeof resizableColumns === 'boolean'
        ? resizableColumns
        : DEFAULT_TABLE_SETTINGS.resizableColumns,
    fixedHeader:
      typeof fixedHeader === 'boolean' ? fixedHeader : DEFAULT_TABLE_SETTINGS.fixedHeader,
  };
}
