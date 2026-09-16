import { Component, ElementRef, input, output, viewChildren } from '@angular/core';

/** The list filters a chip can stand for. */
export type FilterKey = 'search' | 'role' | 'status';

export interface FilterChip {
  key: FilterKey;
  /** The visible text, such as "Role: Admin". */
  label: string;
}

/** Which chip was activated, and where it sat in the row. */
export interface FilterChipRemoval {
  key: FilterKey;
  index: number;
}

/**
 * The row of active filter chips under the list's filters, with Clear all after them. Each chip is
 * a button that removes its filter; its name starts with hidden "Remove filter" text and then says
 * the visible label, so a spoken command matching the label still works (WCAG 2.5.3). Renders
 * nothing while no filter is active.
 */
@Component({
  selector: 'app-filter-chips',
  template: `
    @if (chips().length) {
      <div class="flex flex-wrap items-center gap-2">
        <ul aria-label="Active filters" class="flex flex-wrap items-center gap-2">
          @for (chip of chips(); track chip.key; let index = $index) {
            <li>
              <button
                #chipButton
                type="button"
                (click)="remove.emit({ key: chip.key, index })"
                class="inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-surface-muted pr-2 pl-3 text-sm text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span class="sr-only">Remove filter </span>{{ chip.label }}
                <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4 text-ink-subtle">
                  <path
                    d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </li>
          }
        </ul>
        <button
          type="button"
          (click)="clearAll.emit()"
          class="min-h-8 rounded px-2 text-sm font-medium text-link underline underline-offset-2 hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Clear all
        </button>
      </div>
    }
  `,
})
export class FilterChips {
  readonly chips = input<readonly FilterChip[]>([]);
  readonly remove = output<FilterChipRemoval>();
  readonly clearAll = output<void>();

  private readonly chipButtons = viewChildren<ElementRef<HTMLButtonElement>>('chipButton');

  /**
   * Focuses the chip at `index`, or the last chip when the row is now shorter. Returns false when
   * no chip is left to focus.
   */
  focusChip(index: number): boolean {
    const buttons = this.chipButtons();
    const button = buttons[Math.min(index, buttons.length - 1)];
    button?.nativeElement.focus();
    return !!button;
  }
}
