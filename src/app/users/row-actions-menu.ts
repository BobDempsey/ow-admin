import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from '../core/api/user.model';

/** How the menu closed, and whether focus should go back to the row's Actions cell. */
export interface RowActionsMenuClose {
  returnFocus: boolean;
}

/** The gap between the menu and its button, and the least space kept to the viewport's edges. */
const GAP_PX = 4;
const EDGE_PX = 8;
const ITEM_COUNT = 2;

/**
 * A user row's Actions menu, with View and Reset password. `UsersGrid` renders it after the grid,
 * not inside the row: grid cells clip their content and rows move with `transform`, which would cut
 * off or misplace a menu inside them. It is fixed to the viewport below its button, right-aligned
 * to it, and flips above when there is not room below.
 *
 * It follows the Theme menu's keyboard pattern, with one difference: Tab and Shift+Tab close the
 * menu and ask for focus back on the Actions cell, because the next Tab stop after the menu is
 * outside the list. Scrolling or resizing closes it too, so it never floats away from its row.
 */
@Component({
  selector: 'app-row-actions-menu',
  imports: [RouterLink],
  host: {
    class: 'fixed top-0 left-0 z-30 block',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(window:resize)': 'closeForViewportChange()',
  },
  template: `
    <div
      role="menu"
      [attr.aria-label]="'Actions for ' + user().name"
      (keydown)="onKeydown($event)"
      class="min-w-40 rounded border border-line bg-surface py-1 text-ink shadow-lg"
    >
      <a
        #item
        role="menuitem"
        [routerLink]="['/users', user().id]"
        [tabindex]="focusedIndex() === 0 ? 0 : -1"
        (click)="closed.emit({ returnFocus: false })"
        class="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        >View</a
      >
      <button
        #item
        type="button"
        role="menuitem"
        [tabindex]="focusedIndex() === 1 ? 0 : -1"
        (click)="chooseResetPassword()"
        class="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        Reset password
      </button>
    </div>
  `,
})
export class RowActionsMenu {
  readonly user = input.required<User>();
  /** The Actions button the menu belongs to. */
  readonly anchor = input.required<HTMLElement>();
  readonly resetPassword = output<void>();
  readonly closed = output<RowActionsMenuClose>();

  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly items = viewChildren<ElementRef<HTMLElement>>('item');
  protected readonly focusedIndex = signal(0);

  constructor() {
    afterNextRender(() => {
      this.place();
      this.focusItem(0);
    });
    // Scrolling anywhere, the grid's own scroll boxes included, would leave the menu behind.
    const onScroll = () => this.closeForViewportChange();
    this.document.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('scroll', onScroll, true));
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        this.focusItem(this.focusedIndex() + 1);
        break;
      case 'ArrowUp':
        this.focusItem(this.focusedIndex() - 1);
        break;
      case 'Home':
        this.focusItem(0);
        break;
      case 'End':
        this.focusItem(ITEM_COUNT - 1);
        break;
      case 'Enter':
        if (this.focusedIndex() === 0) {
          // Enter follows the View link by itself.
          return;
        }
        this.chooseResetPassword();
        break;
      case ' ':
        if (this.focusedIndex() === 0) {
          // Space does not follow a link, so View navigates through the router.
          this.closed.emit({ returnFocus: false });
          void this.router.navigate(['/users', this.user().id]);
        } else {
          this.chooseResetPassword();
        }
        break;
      case 'Escape':
      case 'Tab':
        this.closed.emit({ returnFocus: true });
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected chooseResetPassword(): void {
    this.closed.emit({ returnFocus: false });
    this.resetPassword.emit();
  }

  protected onDocumentPointerDown(event: Event): void {
    const target = event.target as Node;
    // A press on the Actions button is left to the button, which toggles the menu.
    if (!this.host.contains(target) && !this.anchor().contains(target)) {
      this.closed.emit({ returnFocus: false });
    }
  }

  protected closeForViewportChange(): void {
    this.closed.emit({ returnFocus: this.host.contains(this.document.activeElement) });
  }

  /**
   * Puts the menu below its button, right edges lined up, or above the button when the space below
   * is too short, then keeps it inside the viewport.
   */
  private place(): void {
    const button = this.anchor().getBoundingClientRect();
    const menu = this.host.getBoundingClientRect();
    const view = this.document.documentElement;
    const width = view.clientWidth;
    const height = view.clientHeight;
    const fitsBelow = button.bottom + GAP_PX + menu.height <= height - EDGE_PX;
    const top = fitsBelow ? button.bottom + GAP_PX : button.top - GAP_PX - menu.height;
    const left = button.right - menu.width;
    this.host.style.top = `${clamp(top, EDGE_PX, height - EDGE_PX - menu.height)}px`;
    this.host.style.left = `${clamp(left, EDGE_PX, width - EDGE_PX - menu.width)}px`;
  }

  private focusItem(index: number): void {
    const next = ((index % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
    this.focusedIndex.set(next);
    // The menu is fixed and placed on screen, so focusing it never needs to scroll the page.
    this.items()[next]?.nativeElement.focus({ preventScroll: true });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
