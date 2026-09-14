import {
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';
import { API_BASE_URL, API_LATENCY_MS } from '../api-config';
import { ApiErrorBody, FieldErrors } from '../api-error';
import { UserStore, etagOf } from './user-store';
import { validateDraft, validatePage, validateUser } from './user-validation';

const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  412: 'Precondition Failed',
  428: 'Precondition Required',
} as const;

type Status = keyof typeof STATUS_TEXT;
type Headers = Record<string, string>;
type Result = HttpResponse<unknown> | HttpErrorResponse;

interface Context {
  req: HttpRequest<unknown>;
  store: UserStore;
  baseUrl: string;
}

/**
 * Plays the user API server. Requests under `API_BASE_URL` are answered from `UserStore` with
 * synthetic responses and never reach the network; all other requests pass through.
 */
export const inMemoryApiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (req.url !== baseUrl && !req.url.startsWith(`${baseUrl}/`)) {
    return next(req);
  }

  const result = route({ req, store: inject(UserStore), baseUrl });
  const latency = inject(API_LATENCY_MS);
  const settle = (): Observable<HttpEvent<unknown>> =>
    result instanceof HttpErrorResponse ? throwError(() => result) : of(result);
  return latency > 0 ? timer(latency).pipe(switchMap(settle)) : settle();
};

function route(ctx: Context): Result {
  const { req, baseUrl } = ctx;
  const url = new URL(req.urlWithParams.slice(baseUrl.length) || '/', 'http://in-memory.invalid');
  const [collection, rawId, action, ...rest] = url.pathname.split('/').filter(Boolean);
  const notFound = () => fail(req, 404, `No route matches ${req.method} ${url.pathname}.`);

  if (collection !== 'users' || rest.length) {
    return notFound();
  }
  if (rawId === undefined) {
    if (req.method === 'GET') return listUsers(ctx, url.searchParams);
    if (req.method === 'POST') return createUser(ctx);
    return methodNotAllowed(req, 'GET, POST');
  }

  const id = decodeSegment(rawId);
  if (id === null) {
    return notFound();
  }
  if (action === undefined) {
    if (req.method === 'GET') return getUser(ctx, id);
    if (req.method === 'PUT') return updateUser(ctx, id);
    return methodNotAllowed(req, 'GET, PUT');
  }
  if (action === 'password-reset') {
    return req.method === 'POST' ? resetPassword(ctx, id) : methodNotAllowed(req, 'POST');
  }
  return notFound();
}

function listUsers({ req, store }: Context, query: URLSearchParams): Result {
  const page = validatePage(query.get('skip'), query.get('limit'));
  if (!page.ok) {
    return fail(req, 400, 'Invalid pagination parameters.', page.errors);
  }
  return respond(req, 200, store.list(page.value.skip, page.value.limit));
}

function getUser({ req, store }: Context, id: string): Result {
  const stored = store.get(id);
  if (!stored) {
    return userNotFound(req, id);
  }
  return respond(req, 200, stored.user, { ETag: etagOf(stored) });
}

function createUser({ req, store, baseUrl }: Context): Result {
  const draft = validateDraft(parseBody(req.body));
  if (!draft.ok) {
    return fail(req, 400, 'The user is invalid.', draft.errors);
  }
  const stored = store.create(draft.value);
  return respond(req, 201, stored.user, {
    ETag: etagOf(stored),
    Location: `${baseUrl}/users/${encodeURIComponent(stored.user.id)}`,
  });
}

function updateUser({ req, store }: Context, id: string): Result {
  const current = store.get(id);
  if (!current) {
    return userNotFound(req, id);
  }

  const ifMatch = req.headers.get('If-Match');
  if (ifMatch === null) {
    return fail(req, 428, 'An If-Match header is required to update a user.');
  }
  if (ifMatch !== etagOf(current)) {
    return fail(req, 412, 'The user has changed since it was last read.');
  }

  const changes = validateUser(parseBody(req.body), id);
  if (!changes.ok) {
    return fail(req, 400, 'The user is invalid.', changes.errors);
  }
  const updated = store.update(id, changes.value);
  if (!updated) {
    return userNotFound(req, id);
  }
  return respond(req, 200, updated.user, { ETag: etagOf(updated) });
}

function resetPassword({ req, store }: Context, id: string): Result {
  if (!store.get(id)) {
    return userNotFound(req, id);
  }
  return respond(req, 204, null);
}

function respond(req: HttpRequest<unknown>, status: Status, body: unknown, headers: Headers = {}) {
  const hasBody = body !== null;
  return new HttpResponse<unknown>({
    status,
    statusText: STATUS_TEXT[status],
    url: req.urlWithParams,
    headers: new HttpHeaders(
      hasBody ? { 'Content-Type': 'application/json', ...headers } : headers,
    ),
    // A JSON round trip gives the caller its own copy, as a real network response would.
    body: hasBody ? JSON.parse(JSON.stringify(body)) : null,
  });
}

function fail(
  req: HttpRequest<unknown>,
  status: Status,
  message: string,
  fieldErrors?: FieldErrors,
  headers: Headers = {},
) {
  const error: ApiErrorBody = { status, error: STATUS_TEXT[status], message };
  if (fieldErrors) {
    error.fieldErrors = fieldErrors;
  }
  return new HttpErrorResponse({
    status,
    statusText: STATUS_TEXT[status],
    url: req.urlWithParams,
    headers: new HttpHeaders({ 'Content-Type': 'application/json', ...headers }),
    error,
  });
}

function userNotFound(req: HttpRequest<unknown>, id: string) {
  return fail(req, 404, `No user exists with id ${id}.`);
}

function methodNotAllowed(req: HttpRequest<unknown>, allow: string) {
  return fail(req, 405, `${req.method} is not allowed here.`, undefined, { Allow: allow });
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
