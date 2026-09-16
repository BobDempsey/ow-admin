import { Component, Signal, computed, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UsersGridContext } from './users-grid-context';

/** The placeholder drawn for a column: a circle and a bar, a wide bar, a short pill, or nothing. */
export type SkeletonShape = 'name' | 'wide' | 'pill' | 'none';

const SHAPES: Record<string, SkeletonShape> = {
  name: 'name',
  email: 'wide',
  role: 'pill',
  status: 'pill',
  actions: 'none',
};

/**
 * A placeholder for a cell whose row has not loaded, shaped like the column's real content. The
 * bars are hidden from assistive technology, so a placeholder row exposes no text; the list's
 * status line announces the load instead. A failed load leaves its stub rows in place, so the bars
 * show only while a request is in flight. They pulse only when motion is allowed.
 */
@Component({
  selector: 'app-skeleton-cell',
  template: `
    @if (visible()) {
      <span aria-hidden="true" class="flex w-full items-center gap-2">
        @switch (shape()) {
          @case ('name') {
            <span class="size-8 shrink-0 rounded-full bg-skeleton motion-safe:animate-pulse"></span>
            <span class="h-3 w-3/5 rounded bg-skeleton motion-safe:animate-pulse"></span>
          }
          @case ('wide') {
            <span class="h-3 w-4/5 rounded bg-skeleton motion-safe:animate-pulse"></span>
          }
          @case ('pill') {
            <span class="h-5 w-16 rounded-full bg-skeleton motion-safe:animate-pulse"></span>
          }
        }
      </span>
    }
  `,
})
export class SkeletonCell implements ICellRendererAngularComp {
  protected readonly shape = signal<SkeletonShape>('none');
  private readonly loading = signal<Signal<boolean> | undefined>(undefined);
  protected readonly visible = computed(() => this.shape() !== 'none' && !!this.loading()?.());

  agInit(params: ICellRendererParams<unknown, unknown, UsersGridContext>): void {
    this.shape.set(SHAPES[params.column?.getColId() ?? ''] ?? 'wide');
    this.loading.set(params.context?.loading);
  }

  /** A row that loads gets its real renderer, so the grid recreates the cell instead. */
  refresh(): boolean {
    return false;
  }
}
