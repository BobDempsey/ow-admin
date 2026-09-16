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
      class="m-auto w-dialog max-w-lg rounded-lg bg-surface p-6 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <div class="flex items-center gap-3">
        <span
          aria-hidden="true"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted"
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
            <circle cx="7.5" cy="15.5" r="4.5" />
            <path d="m10.7 12.3 9.8-9.8M17 6l3 3M14 9l2 2" />
          </svg>
        </span>
        <h2 id="reset-password-dialog-heading" class="text-xl font-semibold">Reset password?</h2>
      </div>
      <p id="reset-password-dialog-description" class="mt-3 break-words text-ink-muted">
        Send {{ name() }} an email at {{ email() }} with a link to choose a new password?
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <button
          #cancelButton
          type="button"
          (click)="answer(false)"
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
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Cancel
        </button>
        <button
          type="button"
          (click)="answer(true)"
          class="inline-flex min-h-11 items-center gap-2 rounded bg-primary pr-4 pl-3 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 6L2 7" />
          </svg>
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
