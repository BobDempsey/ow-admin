import { Component, ElementRef, output, viewChild } from '@angular/core';

/** What the admin chose to do about a save that answered 412. */
export type ConflictChoice = 'keep' | 'reload' | 'overwrite';

/**
 * The modal shown when a save hits a newer version of the user. A native `<dialog>` opened with
 * `showModal()` makes the page behind it inert and keeps focus inside. Escape counts as Keep
 * editing. The dialog closes itself before emitting the choice.
 *
 * It opens through `show()` rather than an input, so a second conflict that arrives before the
 * next render still reopens it.
 */
@Component({
  selector: 'app-conflict-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="conflict-dialog-heading"
      aria-describedby="conflict-dialog-description"
      (cancel)="onCancel($event)"
      class="m-auto w-dialog max-w-lg rounded-lg bg-surface p-6 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <div class="flex items-center gap-3">
        <span
          aria-hidden="true"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-surface text-danger-ink"
        >
          <svg
            aria-hidden="true"
            class="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </span>
        <h2 id="conflict-dialog-heading" class="text-xl font-semibold">This user changed</h2>
      </div>
      <p id="conflict-dialog-description" class="mt-3 text-ink-muted">
        Another admin saved changes to this user after you opened it. Reload to see their changes
        and discard yours, or overwrite their changes with yours.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button
          #keep
          type="button"
          (click)="choose('keep')"
          class="inline-flex min-h-11 items-center gap-2 rounded border border-line pr-4 pl-3 font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg
            aria-hidden="true"
            class="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          Keep editing
        </button>
        <button
          type="button"
          (click)="choose('reload')"
          class="inline-flex min-h-11 items-center gap-2 rounded border border-line pr-4 pl-3 font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg
            aria-hidden="true"
            class="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Reload
        </button>
        <button
          type="button"
          (click)="choose('overwrite')"
          class="inline-flex min-h-11 items-center gap-2 rounded bg-danger-button pr-4 pl-3 font-medium text-on-primary hover:bg-danger-button-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg
            aria-hidden="true"
            class="size-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <path d="M17 21v-8H7v8M7 3v5h8" />
          </svg>
          Overwrite
        </button>
      </div>
    </dialog>
  `,
})
export class ConflictDialog {
  readonly choice = output<ConflictChoice>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly keep = viewChild.required<ElementRef<HTMLButtonElement>>('keep');

  /** Opens the dialog as a modal, with focus on Keep editing, the choice that loses nothing. */
  show(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.keep().nativeElement.focus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.choose('keep');
  }

  protected choose(choice: ConflictChoice): void {
    this.dialog().nativeElement.close();
    this.choice.emit(choice);
  }
}
