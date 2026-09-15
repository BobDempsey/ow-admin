import { HttpClient, HttpParameterCodec, HttpParams, HttpResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { MonoTypeOperatorFunction, Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { ApiError, toApiError } from './api-error';
import { PageRequest, User, UserDraft, UserPage, Versioned } from './user.model';

/**
 * Encodes every reserved character. Angular's default codec leaves `+` as is, which a server reads
 * as a space, so a search for "jo+ann" would arrive as "jo ann".
 */
const URI_COMPONENT_CODEC: HttpParameterCodec = {
  encodeKey: encodeURIComponent,
  encodeValue: encodeURIComponent,
  decodeKey: decodeURIComponent,
  decodeValue: decodeURIComponent,
};

/** Typed client for the user API. Every failure is emitted as an `ApiError`. */
@Service()
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${inject(API_BASE_URL)}/users`;

  list({ skip, limit, sort, q }: PageRequest = {}): Observable<UserPage> {
    let params = new HttpParams({ encoder: URI_COMPONENT_CODEC });
    if (skip !== undefined) {
      params = params.set('skip', skip);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (sort) {
      params = params.set('sort', `${sort.field}:${sort.direction}`);
    }
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<UserPage>(this.usersUrl, { params }).pipe(catchApiError());
  }

  get(id: string): Observable<Versioned<User>> {
    return this.http
      .get<User>(this.userUrl(id), { observe: 'response' })
      .pipe(map(toVersioned), catchApiError());
  }

  create(draft: UserDraft): Observable<Versioned<User>> {
    return this.http
      .post<User>(this.usersUrl, draft, { observe: 'response' })
      .pipe(map(toVersioned), catchApiError());
  }

  /** Replaces the user's fields. `etag` is the ETag from the caller's last read of this user. */
  update(id: string, draft: UserDraft, etag: string): Observable<Versioned<User>> {
    return this.http
      .put<User>(
        this.userUrl(id),
        { ...draft, id },
        { observe: 'response', headers: { 'If-Match': etag } },
      )
      .pipe(map(toVersioned), catchApiError());
  }

  resetPassword(id: string): Observable<void> {
    return this.http.post<null>(`${this.userUrl(id)}/password-reset`, null).pipe(
      map(() => undefined),
      catchApiError(),
    );
  }

  private userUrl(id: string): string {
    return `${this.usersUrl}/${encodeURIComponent(id)}`;
  }
}

function toVersioned<T>(response: HttpResponse<T>): Versioned<T> {
  const etag = response.headers.get('ETag');
  if (response.body === null || etag === null) {
    throw new ApiError(response.status, 'The response is missing its body or ETag header.');
  }
  return { data: response.body, etag };
}

function catchApiError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error: unknown) => throwError(() => toApiError(error)));
}
