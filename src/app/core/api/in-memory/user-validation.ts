import { FieldErrors } from '../api-error';
import {
  SortDirection,
  USER_ROLES,
  USER_SORT_FIELDS,
  USER_STATUSES,
  UserDraft,
  UserFilter,
  UserSort,
  UserSortField,
} from '../user.model';

export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;
export const MAX_QUERY_LENGTH = 100;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER_PATTERN = /^-?\d+$/;

/** Validates a create payload. Unknown properties are ignored. */
export function validateDraft(body: unknown): ValidationResult<UserDraft> {
  if (!isRecord(body)) {
    return { ok: false, errors: { body: 'The request body must be a JSON object.' } };
  }

  const errors: Record<string, string> = {};
  const name = typeof body['name'] === 'string' ? body['name'].trim() : '';
  const email = typeof body['email'] === 'string' ? body['email'].trim() : '';
  const role = body['role'];
  const status = body['status'];

  if (!name) {
    errors['name'] = 'Name is required';
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors['email'] = 'Email must be a valid email address';
  }
  if (!isOneOf(USER_ROLES, role)) {
    errors['role'] = `Role must be one of ${USER_ROLES.join(', ')}`;
  }
  if (!isOneOf(USER_STATUSES, status)) {
    errors['status'] = `Status must be one of ${USER_STATUSES.join(', ')}`;
  }

  if (!isOneOf(USER_ROLES, role) || !isOneOf(USER_STATUSES, status) || Object.keys(errors).length) {
    return { ok: false, errors };
  }
  return { ok: true, value: { name, email, role, status } };
}

/** Validates an update payload for the user at `id`. The body may omit `id`, but not change it. */
export function validateUser(body: unknown, id: string): ValidationResult<UserDraft> {
  const result = validateDraft(body);
  if (!isRecord(body) || !('id' in body) || body['id'] === id) {
    return result;
  }
  const idError = { id: 'The id in the body must match the user in the URL.' };
  return { ok: false, errors: result.ok ? idError : { ...result.errors, ...idError } };
}

/** Parses `skip` and `limit` query values, applying defaults and capping `limit`. */
export function validatePage(
  skip: string | null,
  limit: string | null,
): ValidationResult<{ skip: number; limit: number }> {
  const errors: Record<string, string> = {};
  const parsedSkip = skip === null ? 0 : parseInteger(skip);
  const parsedLimit = limit === null ? DEFAULT_LIMIT : parseInteger(limit);

  if (parsedSkip === null || parsedSkip < 0) {
    errors['skip'] = 'skip must be an integer of 0 or more.';
  }
  if (parsedLimit === null || parsedLimit < 1) {
    errors['limit'] = 'limit must be an integer of 1 or more.';
  }

  if (parsedSkip === null || parsedLimit === null || Object.keys(errors).length) {
    return { ok: false, errors };
  }
  return { ok: true, value: { skip: parsedSkip, limit: Math.min(parsedLimit, MAX_LIMIT) } };
}

const SORT_PATTERN = new RegExp(`^(${USER_SORT_FIELDS.join('|')}):(asc|desc)$`);

/**
 * Parses the optional `sort` (`<field>:<asc|desc>`), `q`, `role` and `status` query values. A blank
 * `q` means no search; otherwise it is trimmed. A missing or empty `role` or `status` filters
 * nothing, and any other value must be one of the model's values, matched exactly.
 */
export function validateListQuery(
  sort: string | null,
  q: string | null,
  role: string | null = null,
  status: string | null = null,
): ValidationResult<{ sort?: UserSort } & UserFilter> {
  const errors: Record<string, string> = {};
  const match = sort === null ? null : SORT_PATTERN.exec(sort);
  if (sort !== null && !match) {
    errors['sort'] =
      `sort must be <field>:<direction>, with field one of ${USER_SORT_FIELDS.join(', ')} and direction asc or desc.`;
  }
  if (q !== null && q.length > MAX_QUERY_LENGTH) {
    errors['q'] = `q must be ${MAX_QUERY_LENGTH} characters or fewer.`;
  }
  if (role && !isOneOf(USER_ROLES, role)) {
    errors['role'] = `role must be one of ${USER_ROLES.join(', ')}.`;
  }
  if (status && !isOneOf(USER_STATUSES, status)) {
    errors['status'] = `status must be one of ${USER_STATUSES.join(', ')}.`;
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }
  const value: { sort?: UserSort } & UserFilter = {};
  if (match) {
    value.sort = { field: match[1] as UserSortField, direction: match[2] as SortDirection };
  }
  if (q?.trim()) {
    value.q = q.trim();
  }
  if (isOneOf(USER_ROLES, role)) {
    value.role = role;
  }
  if (isOneOf(USER_STATUSES, status)) {
    value.status = status;
  }
  return { ok: true, value };
}

function parseInteger(value: string): number | null {
  if (!INTEGER_PATTERN.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}
