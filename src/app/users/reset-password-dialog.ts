import { Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * The modal that asks before a password reset email goes out. It follows `ConflictDialog`: a
 * native `<dialog>` opened through `show()`, Escape counts as Cancel, and the dialog closes itself
 * before emitting whether the admin confirmed.
 */
@Component({
  selector: 'app-reset-password-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="reset-password-dialog-heading"
      aria-describedby="reset-password-dialog-description"
      (cancel)="onCancel($event)"
      class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-surface p-6 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <h2 id="reset-password-dialog-heading" class="text-xl font-semibold">Reset password?</h2>
      <p id="reset-password-dialog-description" class="mt-3 break-words text-ink-muted">
        Send {{ name() }} an email at {{ email() }} with a link to choose a new password?
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button
          #cancelButton
          type="button"
          (click)="answer(false)"
          class="min-h-11 rounded border border-line px-4 font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="answer(true)"
          class="min-h-11 rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Send reset email
        </button>
      </div>
    </dialog>
  `,
})
export class ResetPasswordDialog {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  /** `true` when the admin chose to send the email, `false` on Cancel or Escape. */
  readonly confirmed = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');

  /** Opens the dialog as a modal, with focus on Cancel, the choice that sends nothing. */
  show(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.cancelButton().nativeElement.focus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.answer(false);
  }

  protected answer(confirmed: boolean): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      dialog.close();
    }
    this.confirmed.emit(confirmed);
  }
}
