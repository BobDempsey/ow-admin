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
      class="text-sky-700 underline underline-offset-2 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >Back to users</a
    >
    <h1 tabindex="-1" class="mt-4 text-2xl font-semibold text-slate-900 focus:outline-none">
      New user
    </h1>
    <p role="status" class="mt-2 min-h-6 text-sm text-slate-600">
      @if (fields().submitting()) {
        Creating user…
      }
    </p>
    <form novalidate (submit)="create($event)" class="mt-4 grid gap-6">
      <app-user-form-fields [fields]="fields" />
      @if (failed()) {
        <div role="alert" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          The user could not be created. Try again.
        </div>
      }
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          class="min-h-11 rounded bg-sky-700 px-4 font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Create user
        </button>
        <a
          routerLink="/users"
          class="inline-flex min-h-11 items-center rounded border border-slate-300 px-4 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >Cancel</a
        >
      </div>
    </form>
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
