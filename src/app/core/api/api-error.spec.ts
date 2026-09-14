import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, toApiError } from './api-error';

describe('toApiError', () => {
  it('reads status, message and field errors from an API error body', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 400,
        error: {
          status: 400,
          error: 'Bad Request',
          message: 'Invalid user.',
          fieldErrors: { name: 'Required.' },
        },
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Invalid user.');
    expect(error.fieldErrors).toEqual({ name: 'Required.' });
  });

  it('reports an unreachable server as status 0', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0 }));

    expect(error.status).toBe(0);
    expect(error.message).toBe('The server could not be reached.');
    expect(error.fieldErrors).toEqual({});
  });

  it('returns an existing ApiError unchanged', () => {
    const original = new ApiError(412, 'Stale.');

    expect(toApiError(original)).toBe(original);
  });

  it('wraps unexpected errors', () => {
    expect(toApiError(new Error('Boom'))).toMatchObject({ status: 0, message: 'Boom' });
  });
});
