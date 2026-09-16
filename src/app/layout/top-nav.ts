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
  // Its children join the header row, so the projected theme switcher sits between the nav and Menu.
  host: { class: 'contents' },
  imports: [RouterLink, RouterLinkActive, NavDrawer],
  template: `
    <nav aria-label="Primary" class="flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-x-6">
      <a
        #wordmark
        routerLink="/users"
        class="inline-flex min-h-11 items-center font-bold text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus md:text-lg"
      >
        OW Admin
      </a>
      <ul class="hidden flex-wrap items-center gap-1 md:flex">
        @for (entry of entries; track entry.label) {
          <li>
            @if (entry.path) {
              <a
                [routerLink]="entry.path"
                routerLinkActive
                ariaCurrentWhenActive="page"
                class="inline-flex min-h-11 items-center border-b-3 border-transparent px-3 text-sm text-header-ink hover:bg-header-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus aria-[current=page]:border-header-accent aria-[current=page]:font-semibold"
              >
                {{ entry.label }}
              </a>
            } @else {
              <button
                type="button"
                aria-disabled="true"
                class="inline-flex min-h-11 cursor-not-allowed items-center border-b-3 border-transparent px-3 text-sm text-header-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus"
              >
                {{ entry.label }}<span class="sr-only"> (not available yet)</span>
              </button>
            }
          </li>
        }
      </ul>
    </nav>
    <ng-content />
    <button
      #menuButton
      type="button"
      aria-haspopup="dialog"
      (click)="openDrawer()"
      title="Menu"
      class="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-header-muted hover:bg-header-hover hover:text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus motion-safe:transition-colors md:hidden"
    >
      <svg
        aria-hidden="true"
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span class="sr-only">Menu</span>
    </button>
    <app-nav-drawer class="contents" [entries]="entries" />
  `,
})
export class TopNav {
  protected readonly entries = NAV_ENTRIES;

  private readonly wordmark = viewChild.required<ElementRef<HTMLAnchorElement>>('wordmark');
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly drawer = viewChild.required(NavDrawer);

  protected openDrawer(): void {
    // The wordmark shows at every width, so it takes focus if widening hides the Menu button.
    this.drawer().show(this.menuButton().nativeElement, this.wordmark().nativeElement);
  }
}
