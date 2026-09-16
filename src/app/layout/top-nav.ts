import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavDrawer, NavEntry } from './nav-drawer';

/** Entries without a path are placeholders, which do nothing when activated. */
const NAV_ENTRIES: readonly NavEntry[] = [
  { label: 'Dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Reports' },
  { label: 'Settings' },
  { label: 'About', path: '/about' },
];

/**
 * The header's navigation. From the `md` breakpoint up the entries sit in the bar; below it they
 * move into `NavDrawer` behind a Menu button. Both renderings read the same `NAV_ENTRIES`, so an
 * entry can never be added to one and missed in the other.
 */
@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive, NavDrawer],
  template: `
    <nav aria-label="Primary" class="flex flex-wrap items-center gap-x-3 gap-y-1 md:gap-x-6">
      <a
        routerLink="/users"
        class="inline-flex min-h-11 items-center font-bold text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus md:text-lg"
      >
        Orbweaver Admin
      </a>
      <ul class="hidden flex-wrap items-center gap-1 md:flex">
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
      <button
        #menuButton
        type="button"
        aria-haspopup="dialog"
        (click)="openDrawer()"
        class="inline-flex min-h-11 items-center px-3 text-sm text-header-ink hover:bg-header-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus md:hidden"
      >
        Menu
      </button>
    </nav>
    <app-nav-drawer [entries]="entries" />
  `,
})
export class TopNav {
  protected readonly entries = NAV_ENTRIES;

  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly drawer = viewChild.required(NavDrawer);

  protected openDrawer(): void {
    this.drawer().show(this.menuButton().nativeElement);
  }
}
