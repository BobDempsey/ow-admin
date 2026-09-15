import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavEntry {
  label: string;
  /** A route the entry links to. */
  path?: string;
  /** An action the entry's button starts instead of navigating. */
  action?: 'settings';
}

/** Entries with neither a path nor an action are placeholders, which do nothing when activated. */
const NAV_ENTRIES: readonly NavEntry[] = [
  { label: 'Dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Reports' },
  { label: 'Settings', action: 'settings' },
  { label: 'About', path: '/about' },
];

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Primary" class="flex flex-wrap items-center gap-x-6 gap-y-1">
      <a
        routerLink="/users"
        class="inline-flex min-h-11 items-center text-lg font-bold text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus"
      >
        Orbweaver Admin
      </a>
      <ul class="flex flex-wrap items-center gap-1">
        @for (entry of entries; track entry.label) {
          <li>
            @if (entry.path) {
              <a
                [routerLink]="entry.path"
                routerLinkActive
                ariaCurrentWhenActive="page"
                class="inline-flex min-h-11 items-center border-b-[3px] border-transparent px-3 text-sm text-header-ink hover:bg-header-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus aria-[current=page]:border-header-accent aria-[current=page]:font-semibold"
              >
                {{ entry.label }}
              </a>
            } @else if (entry.action === 'settings') {
              <button
                #settingsButton
                type="button"
                aria-haspopup="dialog"
                (click)="openSettings.emit(settingsButton)"
                class="inline-flex min-h-11 items-center border-b-[3px] border-transparent px-3 text-sm text-header-ink hover:bg-header-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus"
              >
                {{ entry.label }}
              </button>
            } @else {
              <button
                type="button"
                aria-disabled="true"
                class="inline-flex min-h-11 cursor-not-allowed items-center border-b-[3px] border-transparent px-3 text-sm text-header-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus"
              >
                {{ entry.label }}<span class="sr-only"> (not available yet)</span>
              </button>
            }
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TopNav {
  /** Emits the Settings button, so the dialog can return focus to it on close. */
  readonly openSettings = output<HTMLElement>();

  protected readonly entries = NAV_ENTRIES;
}
