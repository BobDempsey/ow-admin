import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../core/api/api-error';
import { USER_ROLES, USER_STATUSES, UserRole, UserStatus } from '../core/api/user.model';
import { TableSettingsDialog } from './table-settings-dialog';
import { EMPTY_LIST_QUERY, ListQuery } from './users-datasource';
import { UsersGrid } from './users-grid';

/** How long typing must pause before the search is sent. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Words a user count, singular only for exactly 1: "1 user", "2 users", "1 user matches". */
export function countLabel(total: number, matching: boolean): string {
  const count = total.toLocaleString('en-US');
  if (total === 1) {
    return matching ? `${count} user matches` : `${count} user`;
  }
  return matching ? `${count} users match` : `${count} users`;
}

/** Whether a query narrows the list, which is what makes the count a match count. */
function isNarrowed({ q, role, status }: ListQuery): boolean {
  return Boolean(q || role || status);
}

/**
 * The user list screen: the total, search, role and status filters, table settings, load status,
 * and the paged user grid.
 */
@Component({
  selector: 'app-users-page',
  imports: [RouterLink, TableSettingsDialog, UsersGrid],
  template: `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h1 #heading tabindex="-1" class="text-2xl font-semibold text-ink focus:outline-none">
        Users
      </h1>
      @if (totalLabel(); as label) {
        <p class="text-ink-subtle tabular-nums">{{ label }}</p>
      }
      <a
        routerLink="/users/new"
        class="ml-auto inline-flex min-h-11 items-center rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >New user</a
      >
    </div>
    <p class="mt-1 text-ink-muted">
      Find a user by name or email, or narrow the list by role and status.
    </p>
    <!-- One card holds the filters, the load status and the grid; the grid sits flush inside it. -->
    <div class="mt-4 overflow-clip rounded-card border border-line-subtle bg-surface shadow-card">
      <div class="flex flex-wrap items-end gap-4 px-4 pt-4 pb-2">
        <div class="grid max-w-md grow basis-64 gap-1">
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
        <div class="grid gap-1">
          <label for="users-role" class="font-medium text-ink">Role</label>
          <select
            id="users-role"
            [value]="role()"
            (change)="onRoleChange($event)"
            class="min-h-11 select-caret rounded border border-line-input bg-surface pl-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Any role</option>
            @for (option of roles; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>
        <div class="grid gap-1">
          <label for="users-status" class="font-medium text-ink">Status</label>
          <select
            id="users-status"
            [value]="status()"
            (change)="onStatusChange($event)"
            class="min-h-11 select-caret rounded border border-line-input bg-surface pl-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Any status</option>
            @for (option of statuses; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>
        <button
          #tableSettingsButton
          type="button"
          aria-haspopup="dialog"
          (click)="tableSettings.show(tableSettingsButton)"
          class="ml-auto min-h-11 shrink-0 rounded border border-line px-4 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Table settings
        </button>
      </div>
      <p role="status" class="min-h-6 px-4 pb-2 text-sm text-ink-subtle">
        @if (loading()) {
          Loading users…
        } @else if (announcementText(); as text) {
          <!-- The total beside the heading already shows the count, so only screen readers hear it here. -->
          <span class="sr-only">{{ text }}</span>
        }
      </p>
      @if (error()) {
        <div
          role="alert"
          class="mx-4 mb-4 flex flex-wrap items-center gap-3 rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
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
        class="block border-t border-line-subtle"
        [query]="query()"
        (loadingChange)="onLoadingChange($event)"
        (loaded)="onLoaded($event)"
        (failed)="error.set($event)"
        (openUser)="openUser($event)"
      />
    </div>
    <app-table-settings-dialog #tableSettings />
  `,
})
export default class UsersPage {
  private readonly router = inject(Router);
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  protected readonly total = signal<number | undefined>(undefined);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | undefined>(undefined);

  protected readonly roles = USER_ROLES;
  protected readonly statuses = USER_STATUSES;

  /** What is in the search field. */
  protected readonly searchText = signal('');
  /** The trimmed search the grid uses, set once typing pauses. */
  protected readonly search = signal('');
  /** The chosen role and status. Empty is the "Any" option, which filters nothing. */
  protected readonly role = signal<UserRole | ''>('');
  protected readonly status = signal<UserStatus | ''>('');

  /** What the grid loads. A filter applies at once, while typing still waits for the pause. */
  protected readonly query = computed<ListQuery>(() => {
    const query: ListQuery = { q: this.search() };
    const role = this.role();
    if (role) {
      query.role = role;
    }
    const status = this.status();
    if (status) {
      query.status = status;
    }
    return query;
  });
  /** The query the shown total belongs to, so the wording never runs ahead of the load. */
  protected readonly loadedQuery = signal<ListQuery>(EMPTY_LIST_QUERY);
  /** The result count to announce after a search or filter change loads. */
  protected readonly announcement = signal<{ total: number; matching: boolean } | undefined>(
    undefined,
  );
  private announceNextLoad = false;

  protected readonly totalLabel = computed(() => {
    const total = this.total();
    return total === undefined ? '' : countLabel(total, isNarrowed(this.loadedQuery()));
  });
  protected readonly announcementText = computed(() => {
    const result = this.announcement();
    if (!result) {
      return '';
    }
    return result.total === 0 ? 'No users match' : countLabel(result.total, result.matching);
  });

  constructor() {
    effect((onCleanup) => {
      const text = this.searchText().trim();
      if (text === untracked(this.search)) {
        return;
      }
      const timer = setTimeout(() => {
        this.announceNextLoad = true;
        this.search.set(text);
      }, SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected onRoleChange(event: Event): void {
    this.announceNextLoad = true;
    this.role.set((event.target as HTMLSelectElement).value as UserRole | '');
  }

  protected onStatusChange(event: Event): void {
    this.announceNextLoad = true;
    this.status.set((event.target as HTMLSelectElement).value as UserStatus | '');
  }

  protected onLoadingChange(inFlight: boolean): void {
    this.loading.set(inFlight);
    if (inFlight) {
      this.announcement.set(undefined);
    }
  }

  protected onLoaded(total: number): void {
    const query = this.query();
    this.total.set(total);
    this.loadedQuery.set(query);
    this.error.set(undefined);
    if (this.announceNextLoad) {
      this.announceNextLoad = false;
      this.announcement.set({ total, matching: isNarrowed(query) });
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
