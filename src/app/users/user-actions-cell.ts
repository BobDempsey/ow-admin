import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { User } from '../core/api/user.model';
import { UsersGridContext } from './users-grid-context';

/**
 * The Actions cell: a button that opens the row's Actions menu. It is never a Tab stop of its own,
 * so the grid stays one; the admin arrows to the cell and presses Enter or Space, which `UsersGrid`
 * handles. It has no visible text, so its name is the only label to match. Loading rows render
 * nothing.
 */
@Component({
  selector: 'app-user-actions-cell',
  template: `
    @if (user(); as user) {
      <button
        #button
        type="button"
        tabindex="-1"
        aria-haspopup="menu"
        [attr.aria-expanded]="expanded()"
        [attr.aria-label]="'Actions for ' + user.name"
        (click)="toggle()"
        class="inline-flex size-8 items-center justify-center rounded text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" class="size-4">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
    }
  `,
})
export class UserActionsCell implements ICellRendererAngularComp {
  protected readonly user = signal<User | undefined>(undefined);
  private readonly rowIndex = signal(0);
  private readonly context = signal<UsersGridContext | undefined>(undefined);
  private readonly button = viewChild<ElementRef<HTMLButtonElement>>('button');

  protected readonly expanded = computed(() => {
    const user = this.user();
    return !!user && this.context()?.actionsOpenFor() === user.id;
  });

  agInit(params: ICellRendererParams<User, unknown, UsersGridContext>): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams<User, unknown, UsersGridContext>): boolean {
    this.user.set(params.data);
    this.rowIndex.set(params.node.rowIndex ?? 0);
    this.context.set(params.context);
    return true;
  }

  protected toggle(): void {
    const user = this.user();
    const button = this.button()?.nativeElement;
    if (user && button) {
      this.context()?.toggleActions(user, button, this.rowIndex());
    }
  }
}
