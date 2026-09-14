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
      class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60"
    >
      <h2 id="conflict-dialog-heading" class="text-xl font-semibold">This user changed</h2>
      <p id="conflict-dialog-description" class="mt-3 text-slate-700">
        Another admin saved changes to this user after you opened it. Reload to see their changes
        and discard yours, or overwrite their changes with yours.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button
          #keep
          type="button"
          (click)="choose('keep')"
          class="min-h-11 rounded border border-slate-300 px-4 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Keep editing
        </button>
        <button
          type="button"
          (click)="choose('reload')"
          class="min-h-11 rounded border border-slate-300 px-4 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Reload
        </button>
        <button
          type="button"
          (click)="choose('overwrite')"
          class="min-h-11 rounded bg-red-700 px-4 font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
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
