## Why

The project currently states requirements only in a plain-English `SPEC.md`.
The team has adopted OpenSpec for spec-driven development, and `SPEC.md`
should not remain a second, competing source of truth once its content is
captured as structured specs.

## What Changes

- Establish structured OpenSpec capabilities covering the full take-home
  scope: navigation, user list, user create/edit, password reset, the
  client-side API layer, and accessibility.
- No behavior exists yet to change; this defines the target behavior for a
  greenfield build.
- `SPEC.md` will be deleted once these specs are archived into
  `openspec/specs/` (tracked separately, not part of this change's tasks).

## Capabilities

### New Capabilities

- `admin-navigation`: top navigation bar with an entry to the user
  management screen; other entries may be non-functional placeholders.
- `user-list`: paginated, server-side-driven list of users, designed for
  500,000 users (no full-set client-side loading or slicing).
- `user-management`: create a user, view and edit an existing user's
  details, including optimistic-concurrency conflict handling on edit.
- `password-reset`: trigger a password reset for a user from the admin UI.
- `user-api-client`: client-side API layer over an in-memory store, shaped
  like a real HTTP client (request/response shapes, headers, status codes,
  pagination, ETag/If-Match concurrency, error handling).
- `accessibility`: WCAG 2.2 conformance (keyboard navigation, focus
  management, labels, contrast, form error messaging) across the admin UI.

### Modified Capabilities

None. No specs exist yet.

## Impact

- Affects `openspec/specs/` only; no application code exists yet.
- Establishes the contract that `user-list`, `user-management`, and
  `password-reset` consume `user-api-client`, and that the built UI is
  Angular + Tailwind CSS per the recorded stack decision.
