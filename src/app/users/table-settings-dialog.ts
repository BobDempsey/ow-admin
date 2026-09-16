import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import {
  TABLE_DENSITIES,
  TableDensity,
  TableSettingsService,
} from '../core/table-settings.service';

/** A WCAG 2.2 A or AA criterion the selected value of a setting makes the app fail. */
export interface WcagFailure {
  criterion: string;
  text: string;
}

/**
 * The WCAG failures each setting value causes, so the dialog can say so beside the control. Add an
 * entry here when a new setting has a value that fails a criterion; values not listed conform.
 */
export const WCAG_FAILURES = {
  movableColumns: (on: boolean): WcagFailure | undefined =>
    on
      ? {
          criterion: '2.5.7 Dragging Movements',
          text: 'Columns can then be moved only by dragging, with no keyboard or single-pointer alternative.',
        }
      : undefined,
  resizableColumns: (on: boolean): WcagFailure | undefined =>
    on
      ? {
          criterion: '2.5.7 Dragging Movements',
          text: 'Column widths can then be changed by dragging or from the keyboard, with no single-pointer alternative.',
        }
      : undefined,
};

const DENSITY_LABELS: Record<TableDensity, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
};

/**
 * The controls draw their own checked and unchecked states from the color tokens instead of
 * leaving them to the browser, which rendered an unchecked control as a filled grey box in the
 * dark theme. Forced colors hands the drawing back to the browser.
 */
const CONTROL_CLASSES =
  'size-6 shrink-0 appearance-none border-2 border-line-input bg-surface forced-colors:appearance-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** Checked: a primary ring with a primary centre dot, separated by a ring of the dialog surface. */
const RADIO_CLASSES = `${CONTROL_CLASSES} rounded-full checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--color-surface)]`;

/** Checked: a primary box with the `--check-mark` tick from styles.css drawn on it. */
const CHECKBOX_CLASSES = `${CONTROL_CLASSES} rounded-sm checked:border-primary checked:bg-primary checked:bg-center checked:bg-no-repeat checked:[background-image:var(--check-mark)]`;

/**
 * The modal Table settings dialog, opened from the user list. Every change applies at once through
 * its service. Like `ConflictDialog` it is a native `<dialog>` opened with `showModal()` through
 * `show()`; Close and Escape share one path that returns focus to the opener.
 */
@Component({
  selector: 'app-table-settings-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="settings-dialog-heading"
      (cancel)="onCancel($event)"
      class="m-auto max-h-[calc(100dvh-2rem)] w-dialog max-w-lg overflow-y-auto rounded-lg bg-surface p-6 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <h2
        #heading
        id="settings-dialog-heading"
        tabindex="-1"
        class="text-xl font-semibold focus:outline-none"
      >
        Table settings
      </h2>

      <label class="mt-4 flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          [checked]="table.striped()"
          (change)="table.update({ striped: checked($event) })"
          class="${CHECKBOX_CLASSES}"
        />
        Striped rows
      </label>

      <fieldset class="mt-2">
        <legend class="text-ink-muted">Density</legend>
        <div class="flex flex-wrap gap-x-6">
          @for (option of densityOptions; track option) {
            <label class="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="settings-density"
                [value]="option"
                [checked]="table.density() === option"
                (change)="table.update({ density: option })"
                class="${RADIO_CLASSES}"
              />
              {{ densityLabels[option] }}
            </label>
          }
        </div>
      </fieldset>

      <label class="mt-2 flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          [checked]="table.movableColumns()"
          [attr.aria-describedby]="movableColumnsDescription()"
          (change)="table.update({ movableColumns: checked($event) })"
          class="${CHECKBOX_CLASSES}"
        />
        Draggable columns
      </label>
      <p id="settings-movable-columns-hint" class="pl-8 text-sm text-ink-subtle">
        Drag a column header to reorder the columns.
      </p>
      @if (movableColumnsFailure(); as failure) {
        <p
          id="settings-movable-columns-wcag"
          class="mt-1 rounded border-l-4 border-danger-field bg-danger-surface px-3 py-2 text-sm text-danger-ink"
        >
          <strong>Fails WCAG {{ failure.criterion }}.</strong> {{ failure.text }}
        </p>
      }

      <label class="mt-2 flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          [checked]="table.resizableColumns()"
          [attr.aria-describedby]="resizableColumnsDescription()"
          (change)="table.update({ resizableColumns: checked($event) })"
          class="${CHECKBOX_CLASSES}"
        />
        Resizable columns
      </label>
      <p id="settings-resizable-columns-hint" class="pl-8 text-sm text-ink-subtle">
        Drag the edge of a column header, or press Alt with Left or Right Arrow on a focused header,
        to change its width.
      </p>
      @if (resizableColumnsFailure(); as failure) {
        <p
          id="settings-resizable-columns-wcag"
          class="mt-1 rounded border-l-4 border-danger-field bg-danger-surface px-3 py-2 text-sm text-danger-ink"
        >
          <strong>Fails WCAG {{ failure.criterion }}.</strong> {{ failure.text }}
        </p>
      }

      <label class="mt-2 flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          [checked]="table.fixedHeader()"
          (change)="table.update({ fixedHeader: checked($event) })"
          class="${CHECKBOX_CLASSES}"
        />
        Fixed header
      </label>
      <p class="pl-8 text-sm text-ink-subtle">
        Keep the column header in view while scrolling through a page of users.
      </p>

      <div class="mt-6 flex justify-end">
        <button
          type="button"
          (click)="close()"
          class="min-h-11 rounded border border-line px-4 font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Close
        </button>
      </div>
    </dialog>
  `,
})
export class TableSettingsDialog {
  protected readonly table = inject(TableSettingsService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private opener: HTMLElement | undefined;

  protected readonly densityOptions = TABLE_DENSITIES;
  protected readonly densityLabels = DENSITY_LABELS;
  protected readonly movableColumnsFailure = computed(() =>
    WCAG_FAILURES.movableColumns(this.table.movableColumns()),
  );
  /** The hint always describes the checkbox; the WCAG note joins it while the setting is on. */
  protected readonly movableColumnsDescription = computed(() =>
    this.movableColumnsFailure()
      ? 'settings-movable-columns-hint settings-movable-columns-wcag'
      : 'settings-movable-columns-hint',
  );
  protected readonly resizableColumnsFailure = computed(() =>
    WCAG_FAILURES.resizableColumns(this.table.resizableColumns()),
  );
  protected readonly resizableColumnsDescription = computed(() =>
    this.resizableColumnsFailure()
      ? 'settings-resizable-columns-hint settings-resizable-columns-wcag'
      : 'settings-resizable-columns-hint',
  );

  /** Opens the dialog as a modal with focus on its heading; closing returns focus to `opener`. */
  show(opener?: HTMLElement): void {
    this.opener = opener;
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.heading().nativeElement.focus();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.opener?.focus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
