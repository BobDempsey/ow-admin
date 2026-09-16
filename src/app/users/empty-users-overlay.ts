import { Component, input, output } from '@angular/core';

/**
 * What the list shows when a loaded page has no users. While a search or filter is active it
 * offers Clear filters; with none active the list is simply empty. `UsersPage` renders it below
 * the grid, because AG Grid's own overlay turns pointer events off for everything inside it.
 */
@Component({
  selector: 'app-empty-users-overlay',
  template: `
    <div class="grid justify-items-center gap-1 px-4 py-8 text-center">
      @if (filtered()) {
        <h2 class="text-lg font-semibold text-ink">No users match</h2>
        <p class="text-ink-muted">
          Try a different search or filter, or clear them to see every user.
        </p>
        <button
          type="button"
          (click)="clearFilters.emit()"
          class="mt-3 min-h-11 rounded border border-line px-4 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Clear filters
        </button>
      } @else {
        <h2 class="text-lg font-semibold text-ink">No users yet</h2>
        <p class="text-ink-muted">Create a user to see them here.</p>
      }
    </div>
  `,
})
export class EmptyUsersOverlay {
  /** Whether the empty result comes from a search or filter. */
  readonly filtered = input.required<boolean>();
  readonly clearFilters = output<void>();
}
