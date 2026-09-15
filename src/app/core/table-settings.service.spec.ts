import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TABLE_SETTINGS_STORAGE_KEY, TableSettingsService } from './table-settings.service';

const stored = () => JSON.parse(localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY) ?? 'null');
const values = (service: TableSettingsService) => ({
  striped: service.striped(),
  density: service.density(),
  movableColumns: service.movableColumns(),
});

describe('TableSettingsService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts with striping off, comfortable rows and fixed columns, and stores nothing', () => {
    const service = TestBed.inject(TableSettingsService);

    expect(values(service)).toEqual({
      striped: false,
      density: 'comfortable',
      movableColumns: false,
    });
    expect(localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('restores stored settings', () => {
    localStorage.setItem(
      TABLE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ striped: true, density: 'compact', movableColumns: true }),
    );

    expect(values(TestBed.inject(TableSettingsService))).toEqual({
      striped: true,
      density: 'compact',
      movableColumns: true,
    });
  });

  it('keeps valid stored fields and defaults the missing or invalid ones', () => {
    localStorage.setItem(
      TABLE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ striped: true, density: 'roomy', movableColumns: 'yes' }),
    );

    expect(values(TestBed.inject(TableSettingsService))).toEqual({
      striped: true,
      density: 'comfortable',
      movableColumns: false,
    });
  });

  it('falls back to defaults when the stored value is not JSON', () => {
    localStorage.setItem(TABLE_SETTINGS_STORAGE_KEY, '{not json');

    expect(TestBed.inject(TableSettingsService).density()).toBe('comfortable');
  });

  it('applies and stores a change, keeping the other settings', () => {
    const service = TestBed.inject(TableSettingsService);

    service.update({ density: 'compact' });
    service.update({ striped: true });

    expect(values(service)).toEqual({ striped: true, density: 'compact', movableColumns: false });
    expect(stored()).toEqual({ striped: true, density: 'compact', movableColumns: false });
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
