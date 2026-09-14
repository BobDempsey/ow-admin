import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavEntry {
  label: string;
  /** Omitted for placeholder entries, which do nothing when activated. */
  path?: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { label: 'Dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Reports' },
  { label: 'Settings' },
];

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      aria-label="Primary"
      class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-1"
    >
      <a
        routerLink="/users"
        class="inline-flex min-h-11 items-center text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
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
                class="inline-flex min-h-11 items-center border-b-[3px] border-transparent px-3 text-sm text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 aria-[current=page]:border-sky-400 aria-[current=page]:font-semibold"
              >
                {{ entry.label }}
              </a>
            } @else {
              <button
                type="button"
                aria-disabled="true"
                class="inline-flex min-h-11 cursor-not-allowed items-center border-b-[3px] border-transparent px-3 text-sm text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
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
  protected readonly entries = NAV_ENTRIES;
}
