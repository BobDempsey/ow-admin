import { Component, computed, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { User, UserStatus } from '../core/api/user.model';

/** Which user field a pill shows. */
export type PillKind = 'role' | 'status';

export interface UserPillCellParams {
  kind: PillKind;
}

const PILL =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap';

/**
 * Complete class lists, so Tailwind finds every one. Each status has its own color, and the word
 * always sits inside the pill, so color is never the only cue (WCAG 1.4.1).
 */
export const STATUS_PILL_CLASSES: Record<UserStatus, string> = {
  active: `${PILL} border-status-active-line bg-status-active-surface text-status-active-ink`,
  invited: `${PILL} border-status-invited-line bg-status-invited-surface text-status-invited-ink`,
  suspended: `${PILL} border-status-suspended-line bg-status-suspended-surface text-status-suspended-ink`,
};

/** Every role shares one neutral pill. */
export const ROLE_PILL_CLASSES = `${PILL} border-line bg-surface-muted text-ink-muted`;

/** Renders a user's role or status as a pill holding the word. Loading rows render nothing. */
@Component({
  selector: 'app-user-pill-cell',
  template: `
    @if (pill(); as pill) {
      <span [class]="pill.classes">{{ pill.text }}</span>
    }
  `,
})
export class UserPillCell implements ICellRendererAngularComp {
  private readonly user = signal<User | undefined>(undefined);
  private readonly kind = signal<PillKind>('status');

  protected readonly pill = computed(() => {
    const user = this.user();
    if (!user) {
      return undefined;
    }
    return this.kind() === 'role'
      ? { text: user.role, classes: ROLE_PILL_CLASSES }
      : { text: user.status, classes: STATUS_PILL_CLASSES[user.status] };
  });

  agInit(params: ICellRendererParams<User> & UserPillCellParams): void {
    this.kind.set(params.kind);
    this.user.set(params.data);
  }

  refresh(params: ICellRendererParams<User> & UserPillCellParams): boolean {
    this.kind.set(params.kind);
    this.user.set(params.data);
    return true;
  }
}
