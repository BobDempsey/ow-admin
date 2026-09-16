import { Signal } from '@angular/core';
import { User } from '../core/api/user.model';

/** What `UsersGrid` passes to every cell through AG Grid's `context`. */
export interface UsersGridContext {
  /** True while a page request that shows loading is in flight. */
  loading: Signal<boolean>;
  /** The id of the user whose Actions menu is open, if any. */
  actionsOpenFor: Signal<string | undefined>;
  /** Opens a row's Actions menu below `button`, or closes it when it is already open. */
  toggleActions(user: User, button: HTMLElement, rowIndex: number): void;
}
