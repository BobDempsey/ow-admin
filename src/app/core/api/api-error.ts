import { HttpErrorResponse } from '@angular/common/http';

/** Maps a field name to the message describing why its value was rejected. */
export type FieldErrors = Readonly<Record<string, string>>;

/** The JSON body the API returns with every error status. */
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  fieldErrors?: FieldErrors;
}

/** The single error type `UsersApi` emits, whatever went wrong. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    if (isApiErrorBody(error.error)) {
      return new ApiError(error.status, error.error.message, error.error.fieldErrors);
    }
    const message = error.status === 0 ? 'The server could not be reached.' : error.message;
    return new ApiError(error.status, message);
  }
  return new ApiError(0, error instanceof Error ? error.message : 'An unexpected error occurred.');
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    (!('fieldErrors' in value) ||
      (typeof value.fieldErrors === 'object' && value.fieldErrors !== null))
  );
}
