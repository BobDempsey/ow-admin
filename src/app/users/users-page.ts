import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../core/api/api-error';
import { UsersGrid } from './users-grid';

/** How long typing must pause before the search is sent. */
export const SEARCH_DEBOUNCE_MS = 300;

/** The user list screen: the total, search, load status, and the paged user grid. */
@Component({
  selector: 'app-users-page',
  imports: [DecimalPipe, RouterLink, UsersGrid],
  template: `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h1 #heading tabindex="-1" class="text-2xl font-semibold text-ink focus:outline-none">
        Users
      </h1>
      @if (total() !== undefined) {
        <p class="text-ink-subtle">
          {{ total() | number }} users{{ loadedQuery() ? ' match' : '' }}
        </p>
      }
      <a
        routerLink="/users/new"
        class="ml-auto inline-flex min-h-11 items-center rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >New user</a
      >
    </div>
    <div class="mt-4 grid max-w-md gap-1">
      <label for="users-search" class="font-medium text-ink">Search users</label>
      <input
        id="users-search"
        type="search"
        placeholder="Name or email"
        autocomplete="off"
        maxlength="100"
        [value]="searchText()"
        (input)="onSearchInput($event)"
        class="min-h-11 w-full rounded border border-line-input bg-surface px-3 text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
    </div>
    <p role="status" class="mt-2 min-h-6 text-sm text-ink-subtle">
      @if (loading()) {
        Loading users…
      } @else if (announcement(); as result) {
        @if (result.total === 0) {
          No users match
        } @else {
          {{ result.total | number }} users{{ result.query ? ' match' : '' }}
        }
      }
    </p>
    @if (error()) {
      <div
        role="alert"
        class="mt-2 flex flex-wrap items-center gap-3 rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
      >
        <span>Users could not be loaded.</span>
        <button
          type="button"
          (click)="retry(grid)"
          class="min-h-11 rounded border border-danger-line-strong bg-surface px-4 font-medium text-danger-ink hover:bg-danger-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Try again
        </button>
      </div>
    }
    <app-users-grid
      #grid
      class="mt-4 block"
      [query]="query()"
      (loadingChange)="onLoadingChange($event)"
      (loaded)="onLoaded($event)"
      (failed)="error.set($event)"
      (openUser)="openUser($event)"
    />
  `,
})
export default class UsersPage {
  private readonly router = inject(Router);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly total = signal<number | undefined>(undefined);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | undefined>(undefined);

  /** What is in the search field. */
  protected readonly searchText = signal('');
  /** The trimmed search the grid uses, set once typing pauses. */
  protected readonly query = signal('');
  /** The search the shown total belongs to, so the wording never runs ahead of the load. */
  protected readonly loadedQuery = signal('');
  /** The result count to announce after a search or a cleared search loads. */
  protected readonly announcement = signal<{ total: number; query: string } | undefined>(undefined);
  private announceNextLoad = false;

  constructor() {
    effect((onCleanup) => {
      const text = this.searchText().trim();
      if (text === untracked(this.query)) {
        return;
      }
      const timer = setTimeout(() => {
        this.announceNextLoad = true;
        this.query.set(text);
      }, SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected onLoadingChange(inFlight: boolean): void {
    this.loading.set(inFlight);
    if (inFlight) {
      this.announcement.set(undefined);
    }
  }

  protected onLoaded(total: number): void {
    this.total.set(total);
    this.loadedQuery.set(this.query());
    this.error.set(undefined);
    if (this.announceNextLoad) {
      this.announceNextLoad = false;
      this.announcement.set({ total, query: this.query() });
    }
  }

  protected retry(grid: Pick<UsersGrid, 'refresh'>): void {
    // Try again disappears with the alert, so hand focus to the heading instead of losing it.
    this.heading().nativeElement.focus();
    this.error.set(undefined);
    grid.refresh();
  }

  protected openUser(id: string): void {
    void this.router.navigate(['/users', id]);
  }
}
