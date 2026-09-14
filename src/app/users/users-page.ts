import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../core/api/api-error';
import { UsersGrid } from './users-grid';

/** The user list screen: the total, load status, and the paged user grid. */
@Component({
  selector: 'app-users-page',
  imports: [DecimalPipe, RouterLink, UsersGrid],
  template: `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h1 #heading tabindex="-1" class="text-2xl font-semibold text-slate-900 focus:outline-none">
        Users
      </h1>
      @if (total() !== undefined) {
        <p class="text-slate-600">{{ total() | number }} users</p>
      }
      <a
        routerLink="/users/new"
        class="ml-auto inline-flex min-h-11 items-center rounded bg-sky-700 px-4 font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >New user</a
      >
    </div>
    <p role="status" class="mt-2 min-h-6 text-sm text-slate-600">
      @if (loading()) {
        Loading users…
      }
    </p>
    @if (error()) {
      <div
        role="alert"
        class="mt-2 flex flex-wrap items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800"
      >
        <span>Users could not be loaded.</span>
        <button
          type="button"
          (click)="retry(grid)"
          class="min-h-11 rounded border border-red-300 bg-white px-4 font-medium text-red-800 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Try again
        </button>
      </div>
    }
    <app-users-grid
      #grid
      class="mt-4 block"
      (loadingChange)="loading.set($event)"
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

  protected onLoaded(total: number): void {
    this.total.set(total);
    this.error.set(undefined);
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
