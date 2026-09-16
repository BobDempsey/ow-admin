import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TABLE_SETTINGS_STORAGE_KEY, TableSettingsService } from './table-settings.service';

const stored = () => JSON.parse(localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY) ?? 'null');
const values = (service: TableSettingsService) => ({
  striped: service.striped(),
  density: service.density(),
  movableColumns: service.movableColumns(),
  resizableColumns: service.resizableColumns(),
  fixedHeader: service.fixedHeader(),
});

describe('TableSettingsService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts with striping on, compact rows and fixed columns, and stores nothing', () => {
    const service = TestBed.inject(TableSettingsService);

    expect(values(service)).toEqual({
      striped: true,
      density: 'compact',
      movableColumns: false,
      resizableColumns: false,
      fixedHeader: false,
    });
    expect(localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('keeps a Comfortable density stored before Compact became the default', () => {
    localStorage.setItem(TABLE_SETTINGS_STORAGE_KEY, JSON.stringify({ density: 'comfortable' }));

    expect(TestBed.inject(TableSettingsService).density()).toBe('comfortable');
  });

  it('restores stored settings', () => {
    localStorage.setItem(
      TABLE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        striped: true,
        density: 'comfortable',
        movableColumns: true,
        resizableColumns: true,
        fixedHeader: true,
      }),
    );

    expect(values(TestBed.inject(TableSettingsService))).toEqual({
      striped: true,
      density: 'comfortable',
      movableColumns: true,
      resizableColumns: true,
      fixedHeader: true,
    });
  });

  it('keeps valid stored fields and defaults the missing or invalid ones', () => {
    localStorage.setItem(
      TABLE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ striped: true, density: 'roomy', movableColumns: 'yes' }),
    );

    expect(values(TestBed.inject(TableSettingsService))).toEqual({
      striped: true,
      density: 'compact',
      movableColumns: false,
      resizableColumns: false,
      fixedHeader: false,
    });
  });

  it('falls back to defaults when the stored value is not JSON', () => {
    localStorage.setItem(TABLE_SETTINGS_STORAGE_KEY, '{not json');

    expect(TestBed.inject(TableSettingsService).density()).toBe('compact');
  });

  it('applies and stores a change, keeping the other settings', () => {
    const service = TestBed.inject(TableSettingsService);

    service.update({ density: 'comfortable' });
    service.update({ striped: true });
    service.update({ resizableColumns: true });
    service.update({ fixedHeader: true });

    const expected = {
      striped: true,
      density: 'comfortable',
      movableColumns: false,
      resizableColumns: true,
      fixedHeader: true,
    };
    expect(values(service)).toEqual(expected);
    expect(stored()).toEqual(expected);
  });

  it('still applies a change when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    const service = TestBed.inject(TableSettingsService);

    expect(() => service.update({ striped: true })).not.toThrow();
    expect(service.striped()).toBe(true);
  });
});
