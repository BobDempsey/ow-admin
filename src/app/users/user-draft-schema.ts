import {
  FieldTree,
  ValidationError,
  email,
  required,
  requiredError,
  schema,
  validate,
} from '@angular/forms/signals';
import { ApiError } from '../core/api/api-error';
import { UserDraft } from '../core/api/user.model';

/** Client-side rules for a user draft, matching what the API rejects with 400. */
export const userDraftSchema = schema<UserDraft>((user) => {
  validate(user.name, ({ value }) =>
    value().trim() ? undefined : requiredError({ message: 'Enter a name.' }),
  );
  required(user.email, { message: 'Enter an email address.' });
  email(user.email, { message: 'Enter an email address like name@example.com.' });
});

const DRAFT_FIELDS = ['name', 'email', 'role', 'status'] as const;

/**
 * Turns the field errors of a 400 `ApiError` into submission errors on the matching fields.
 * Field errors for anything that is not a form field are dropped.
 */
export function toFieldErrors(
  fields: FieldTree<UserDraft>,
  error: ApiError,
): ValidationError.WithOptionalFieldTree[] {
  return DRAFT_FIELDS.flatMap((key) => {
    const message = error.fieldErrors[key];
    return message ? [{ kind: 'server', message, fieldTree: fields[key] }] : [];
  });
}
