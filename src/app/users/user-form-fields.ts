import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { USER_ROLES, USER_STATUSES, UserDraft } from '../core/api/user.model';

let nextFormId = 0;

/** Moves focus to the first control with an error, so its message is read out with it. */
export function focusFirstError(fields: FieldTree<UserDraft>): void {
  fields().errorSummary()[0]?.fieldTree().focusBoundControl();
}

/**
 * The labeled name, email, role and status controls shared by the create and edit screens.
 * A control shows its first error once it has been touched, which submitting does for every field.
 */
@Component({
  selector: 'app-user-form-fields',
  imports: [FormField],
  host: { class: 'grid gap-5' },
  template: `
    @for (field of textFields; track field.key) {
      @let state = fields()[field.key]();
      @let error = state.touched() ? state.errors()[0]?.message : undefined;
      <div class="grid gap-1">
        <label [for]="id(field.key)" class="font-medium text-ink">{{ field.label }}</label>
        <input
          [id]="id(field.key)"
          [type]="field.type"
          autocomplete="off"
          [formField]="fields()[field.key]"
          [attr.aria-invalid]="error ? 'true' : null"
          [attr.aria-describedby]="error ? id(field.key) + '-error' : null"
          class="min-h-11 w-full max-w-md rounded border border-line-input px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:border-danger-field"
        />
        @if (error) {
          <p [id]="id(field.key) + '-error'" class="text-sm text-danger-field">{{ error }}</p>
        }
      </div>
    }
    @for (field of selectFields; track field.key) {
      <div class="grid gap-1">
        <label [for]="id(field.key)" class="font-medium text-ink">{{ field.label }}</label>
        <select
          [id]="id(field.key)"
          [formField]="fields()[field.key]"
          class="min-h-11 w-full max-w-md rounded border border-line-input bg-surface pl-3 select-caret text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          @for (option of field.options; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
      </div>
    }
  `,
})
export class UserFormFields {
  readonly fields = input.required<FieldTree<UserDraft>>();

  private readonly formId = `user-form-${nextFormId++}`;

  protected readonly textFields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
  ] as const;
  protected readonly selectFields = [
    { key: 'role', label: 'Role', options: USER_ROLES },
    { key: 'status', label: 'Status', options: USER_STATUSES },
  ] as const;

  protected id(key: keyof UserDraft): string {
    return `${this.formId}-${key}`;
  }
}
