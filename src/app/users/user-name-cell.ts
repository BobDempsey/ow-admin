import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { User } from '../core/api/user.model';

/** Renders a user's name as a link to their detail screen. Loading rows render nothing. */
@Component({
  selector: 'app-user-name-cell',
  imports: [RouterLink],
  template: `
    @if (user(); as user) {
      <a
        [routerLink]="['/users', user.id]"
        class="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900"
        >{{ user.name }}</a
      >
    }
  `,
})
export class UserNameCell implements ICellRendererAngularComp {
  protected readonly user = signal<User | undefined>(undefined);

  agInit(params: ICellRendererParams<User>): void {
    this.user.set(params.data);
  }

  refresh(params: ICellRendererParams<User>): boolean {
    this.user.set(params.data);
    return true;
  }
}
