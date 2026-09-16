import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { User } from '../core/api/user.model';
import { AVATAR_COLOR_CLASSES, avatarColorIndex, initialsOf } from './user-avatar';

/**
 * Renders a user's name as a link to their detail screen, after a circle with their initials. The
 * circle is hidden from assistive technology, so the name is read once. Loading rows render nothing.
 */
@Component({
  selector: 'app-user-name-cell',
  imports: [RouterLink],
  template: `
    @if (user(); as user) {
      <span class="inline-flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          [class]="avatarClasses()"
          >{{ initials() }}</span
        >
        <a
          [routerLink]="['/users', user.id]"
          class="min-w-0 font-medium break-words text-link underline underline-offset-2 hover:text-link-hover"
          >{{ user.name }}</a
        >
      </span>
    }
  `,
})
export class UserNameCell implements ICellRendererAngularComp {
  protected readonly user = signal<User | undefined>(undefined);
  protected readonly initials = computed(() => initialsOf(this.user()?.name ?? ''));
  protected readonly avatarClasses = computed(() => {
    const user = this.user();
    return user ? AVATAR_COLOR_CLASSES[avatarColorIndex(user.id)] : '';
  });

  agInit(params: ICellRendererParams<User>): void {
    this.user.set(params.data);
  }

  refresh(params: ICellRendererParams<User>): boolean {
    this.user.set(params.data);
    return true;
  }
}
