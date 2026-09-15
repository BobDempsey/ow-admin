import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

/** A controllable `(prefers-color-scheme: dark)` query, since jsdom has no matchMedia. */
function stubMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: prefersDark,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => query,
  });
  return {
    change(dark: boolean) {
      query.matches = dark;
      listeners.forEach((listener) => listener({ matches: dark } as MediaQueryListEvent));
    },
  };
}

function createService() {
  const service = TestBed.inject(ThemeService);
  TestBed.tick();
  return service;
}

const root = document.documentElement;

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
    root.removeAttribute('data-ag-theme-mode');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('starts at System and follows a dark OS scheme on a first visit', () => {
    stubMatchMedia(true);

    const service = createService();

    expect(service.preference()).toBe('system');
    expect(service.theme()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.getAttribute('data-ag-theme-mode')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores a stored choice over the OS scheme', () => {
    stubMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    const service = createService();

    expect(service.preference()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('ignores a stored value that is not a choice', () => {
    stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

    expect(createService().preference()).toBe('system');
  });

  it('applies and remembers a choice', () => {
    stubMatchMedia(false);
    const service = createService();

    service.choose('dark');
    TestBed.tick();

    expect(service.theme()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('switches with the OS scheme while System is chosen', () => {
    const media = stubMatchMedia(false);
    const service = createService();
    expect(root.getAttribute('data-theme')).toBe('light');

    media.change(true);
    TestBed.tick();

    expect(service.preference()).toBe('system');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('keeps an explicit choice when the OS scheme changes', () => {
    const media = stubMatchMedia(false);
    const service = createService();
    service.choose('light');

    media.change(true);
    TestBed.tick();

    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('still applies a choice when storage throws', () => {
    stubMatchMedia(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    const service = createService();
    expect(service.preference()).toBe('system');

    expect(() => service.choose('dark')).not.toThrow();
    TestBed.tick();

    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('treats the OS scheme as light when matchMedia is missing', () => {
    const service = createService();

    expect(service.theme()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});
