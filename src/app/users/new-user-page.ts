import { Component, inject, signal } from '@angular/core';
import { FieldTree, ValidationError, form, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '../core/api/api-error';
import { UserDraft } from '../core/api/user.model';
import { toFieldErrors, userDraftSchema } from './user-draft-schema';
import { UserFormFields, focusFirstError } from './user-form-fields';
import { UsersService } from './users.service';

/** The create user screen. A created user opens on its detail screen. */
@Component({
  selector: 'app-new-user-page',
  imports: [RouterLink, UserFormFields],
  template: `
    <a
      routerLink="/users"
      class="text-link underline underline-offset-2 hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >Back to users</a
    >
    <h1 tabindex="-1" class="mt-4 text-2xl font-semibold text-ink focus:outline-none">New user</h1>
    <p class="mt-1 text-ink-muted">Add a user and choose their role and status.</p>
    <p role="status" class="mt-2 min-h-6 text-sm text-ink-subtle">
      @if (fields().submitting()) {
        Creating user…
      }
    </p>
    <div class="mt-4 rounded-card border border-line-subtle bg-surface p-4 shadow-card sm:p-6">
      <form novalidate (submit)="create($event)" class="grid gap-6">
        <app-user-form-fields [fields]="fields" />
        @if (failed()) {
          <div
            role="alert"
            class="rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
          >
            The user could not be created. Try again.
          </div>
        }
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            class="min-h-11 rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Create user
          </button>
          <a
            routerLink="/users"
            class="inline-flex min-h-11 items-center rounded border border-line px-4 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >Cancel</a
          >
        </div>
      </form>
    </div>
  `,
})
export default class NewUserPage {
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);

  protected readonly draft = signal<UserDraft>({
    name: '',
    email: '',
    role: 'Member',
    status: 'invited',
  });
  protected readonly fields = form(this.draft, userDraftSchema);
  protected readonly failed = signal(false);

  protected async create(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.fields, (fields) => this.send(fields));
    if (!ok) {
      focusFirstError(this.fields);
    }
  }

  private async send(
    fields: FieldTree<UserDraft>,
  ): Promise<ValidationError.WithOptionalFieldTree[]> {
    this.failed.set(false);
    try {
      const { data } = await this.users.createUser(fields().value());
      await this.router.navigate(['/users', data.id], { state: { notice: 'created' } });
      return [];
    } catch (caught) {
      const error = toApiError(caught);
      const fieldErrors = error.status === 400 ? toFieldErrors(fields, error) : [];
      if (!fieldErrors.length) {
        this.failed.set(true);
      }
      return fieldErrors;
    }
  }
}
