import { DOCUMENT, DestroyRef, Service, computed, effect, inject, signal } from '@angular/core';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type Theme = 'light' | 'dark';

/** The localStorage key for the admin's choice. The inline script in index.html reads it too. */
export const THEME_STORAGE_KEY = 'orbweaver-admin-theme';

/**
 * The admin's theme choice and the theme it resolves to. The resolved theme is written to
 * `data-theme` (read by the color tokens in styles.css) and `data-ag-theme-mode` (read by AG
 * Grid) on `<html>`. System follows the OS color scheme, and is the choice until the admin picks.
 */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = storageOf(this.document.defaultView);
  private readonly systemPrefersDark = signal(false);
  private readonly selected = signal<ThemePreference>(readPreference(this.storage));

  readonly preference = this.selected.asReadonly();
  readonly theme = computed<Theme>(() => {
    const preference = this.selected();
    if (preference !== 'system') {
      return preference;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  constructor() {
    // jsdom has no matchMedia; without it the OS scheme counts as light.
    const query = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (query) {
      this.systemPrefersDark.set(query.matches);
      const onChange = (event: MediaQueryListEvent) => this.systemPrefersDark.set(event.matches);
      query.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
    }

    effect(() => {
      const root = this.document.documentElement;
      root.setAttribute('data-theme', this.theme());
      root.setAttribute('data-ag-theme-mode', this.theme());
    });
  }

  /** Applies a choice and remembers it. When storage is refused the choice lasts for this load. */
  choose(preference: ThemePreference): void {
    this.selected.set(preference);
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Storage can be disabled or full; the theme still applies.
    }
  }
}

function storageOf(view: Window | null): Storage | undefined {
  try {
    return view?.localStorage;
  } catch {
    // Reading localStorage itself throws when site data is blocked.
    return undefined;
  }
}

function readPreference(storage: Storage | undefined): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return THEME_PREFERENCES.find((preference) => preference === stored) ?? 'system';
  } catch {
    return 'system';
  }
}
