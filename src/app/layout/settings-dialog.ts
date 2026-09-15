import { Component, ElementRef, computed, inject, viewChild } from '@angular/core';
import {
  TABLE_DENSITIES,
  TableDensity,
  TableSettingsService,
} from '../core/table-settings.service';
import { THEME_PREFERENCES, ThemePreference, ThemeService } from '../core/theme.service';

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
};

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const DENSITY_LABELS: Record<TableDensity, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
};

const RADIO_CLASSES =
  'size-6 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * The modal Settings dialog, opened from the Settings nav entry. Every change applies at once
 * through its service. Like `ConflictDialog` it is a native `<dialog>` opened with `showModal()`
 * through `show()`; Close and Escape share one path that returns focus to the opener.
 */
@Component({
  selector: 'app-settings-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="settings-dialog-heading"
      (cancel)="onCancel($event)"
      class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-surface p-6 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <h2
        #heading
        id="settings-dialog-heading"
        tabindex="-1"
        class="text-xl font-semibold focus:outline-none"
      >
        Settings
      </h2>

      <fieldset class="mt-5">
        <legend class="font-semibold">Theme</legend>
        <div class="mt-1 flex flex-wrap gap-x-6">
          @for (option of themeOptions; track option) {
            <label class="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="settings-theme"
                [value]="option"
                [checked]="theme.preference() === option"
                (change)="theme.choose(option)"
                class="${RADIO_CLASSES}"
              />
              {{ themeLabels[option] }}
            </label>
          }
        </div>
      </fieldset>

      <section aria-labelledby="settings-table-heading" class="mt-6">
        <h3 id="settings-table-heading" class="font-semibold">Table</h3>

        <label class="mt-1 flex min-h-11 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            [checked]="table.striped()"
            (change)="table.update({ striped: checked($event) })"
            class="${RADIO_CLASSES}"
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
            [attr.aria-describedby]="
              movableColumnsFailure() ? 'settings-movable-columns-wcag' : null
            "
            (change)="table.update({ movableColumns: checked($event) })"
            class="${RADIO_CLASSES}"
          />
          Draggable columns
        </label>
        @if (movableColumnsFailure(); as failure) {
          <p
            id="settings-movable-columns-wcag"
            class="mt-1 rounded border-l-4 border-danger-field bg-danger-surface px-3 py-2 text-sm text-danger-ink"
          >
            <strong>Fails WCAG {{ failure.criterion }}.</strong> {{ failure.text }}
          </p>
        }
      </section>

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
export class SettingsDialog {
  protected readonly theme = inject(ThemeService);
  protected readonly table = inject(TableSettingsService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  private opener: HTMLElement | undefined;

  protected readonly themeOptions = THEME_PREFERENCES;
  protected readonly themeLabels = THEME_LABELS;
  protected readonly densityOptions = TABLE_DENSITIES;
  protected readonly densityLabels = DENSITY_LABELS;
  protected readonly movableColumnsFailure = computed(() =>
    WCAG_FAILURES.movableColumns(this.table.movableColumns()),
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
