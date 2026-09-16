import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationSkipped,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs';

export interface NavEntry {
  label: string;
  /** A route the entry links to. */
  path?: string;
}

/**
 * The navigation drawer shown behind the header's Menu button below the `md` breakpoint. Like
 * `ConflictDialog` and `TableSettingsDialog` it is a native `<dialog>` opened with `showModal()`,
 * which makes the page behind it inert, keeps focus inside and turns Escape into a `cancel` event.
 * Escape, Close, a click on the backdrop and choosing the current screen share one path that
 * returns focus to the opener, while navigating closes the drawer and leaves focus to the new
 * screen. Widening the viewport to `md` hides the opener, so that path focuses the fallback instead.
 */
@Component({
  selector: 'app-nav-drawer',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <dialog
      #dialog
      aria-labelledby="nav-drawer-heading"
      (cancel)="onCancel($event)"
      (click)="onClick($event)"
      class="fixed top-0 left-0 m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none bg-surface p-0 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <!-- Everything sits in this wrapper, so only a backdrop click has the dialog as its target. -->
      <div class="flex h-full flex-col overflow-y-auto p-4">
        <div class="flex items-center justify-between gap-3">
          <h2
            #heading
            id="nav-drawer-heading"
            tabindex="-1"
            class="text-lg font-semibold focus:outline-none"
          >
            Menu
          </h2>
          <button
            type="button"
            title="Close"
            (click)="close()"
            class="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus motion-safe:transition-colors"
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
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span class="sr-only">Close</span>
          </button>
        </div>
        <ul class="mt-4 flex flex-col">
          @for (entry of entries(); track entry.label) {
            <li>
              @if (entry.path) {
                <a
                  [routerLink]="entry.path"
                  routerLinkActive
                  ariaCurrentWhenActive="page"
                  class="flex min-h-11 items-center border-l-4 border-transparent px-3 text-sm text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-[current=page]:border-nav-current aria-[current=page]:font-semibold"
                >
                  {{ entry.label }}
                </a>
              } @else {
                <button
                  type="button"
                  aria-disabled="true"
                  class="flex min-h-11 w-full cursor-not-allowed items-center border-l-4 border-transparent px-3 text-left text-sm text-ink-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                >
                  {{ entry.label }}<span class="sr-only"> (not available yet)</span>
                </button>
              }
            </li>
          }
        </ul>
      </div>
    </dialog>
  `,
})
export class NavDrawer {
  readonly entries = input.required<readonly NavEntry[]>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private opener: HTMLElement | undefined;
  private fallback: HTMLElement | undefined;

  constructor() {
    // A chosen entry navigates, and `App` moves focus to the new screen's heading, so the drawer
    // closes without taking focus back to the Menu button. Choosing the screen already shown makes
    // the router skip the navigation, and nothing moves focus, so the drawer returns it.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
        takeUntilDestroyed(),
      )
      .subscribe((event) =>
        event instanceof NavigationEnd ? this.closeOnNavigation() : this.closeIfOpen(),
      );

    // At `md` the drawer's entries are back in the bar, but an open modal would keep the page
    // inert. jsdom has no matchMedia, so tests without a stub skip this.
    const wide = inject(DOCUMENT).defaultView?.matchMedia?.('(min-width: 48rem)');
    if (wide) {
      const onChange = (event: MediaQueryListEvent) => {
        if (event.matches) {
          this.closeOnWiden();
        }
      };
      wide.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => wide.removeEventListener('change', onChange));
    }
  }

  /**
   * Opens the drawer as a modal with focus on its heading; closing returns focus to `opener`, or
   * to `fallback` when the viewport widens and hides the opener.
   */
  show(opener?: HTMLElement, fallback?: HTMLElement): void {
    this.opener = opener;
    this.fallback = fallback;
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.heading().nativeElement.focus();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.opener?.focus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  private closeOnNavigation(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      dialog.close();
    }
  }

  private closeIfOpen(): void {
    if (this.dialog().nativeElement.open) {
      this.close();
    }
  }

  private closeOnWiden(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      dialog.close();
      this.fallback?.focus();
    }
  }

  /** A click on the backdrop reaches the dialog element itself; a click inside never does. */
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
