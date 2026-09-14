import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { ApiError } from '../core/api/api-error';
import { UserDraft } from '../core/api/user.model';
import { toFieldErrors, userDraftSchema } from './user-draft-schema';

const complete: UserDraft = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  role: 'Admin',
  status: 'active',
};

function draftForm(draft: UserDraft) {
  return form(signal(draft), userDraftSchema, { injector: TestBed.inject(Injector) });
}

describe('userDraftSchema', () => {
  it('accepts a complete draft', () => {
    expect(draftForm(complete)().valid()).toBe(true);
  });

  it.each(['', '   '])('rejects the name %j', (name) => {
    const fields = draftForm({ ...complete, name });

    expect(fields().valid()).toBe(false);
    expect(
      fields
        .name()
        .errors()
        .map((error) => error.message),
    ).toEqual(['Enter a name.']);
  });

  it('rejects a missing email', () => {
    const fields = draftForm({ ...complete, email: '' });

    expect(fields().valid()).toBe(false);
    expect(fields.email().errors()[0]?.message).toBe('Enter an email address.');
  });

  it('rejects an invalid email', () => {
    const fields = draftForm({ ...complete, email: 'grace@' });

    expect(fields().valid()).toBe(false);
    expect(fields.email().errors()[0]?.message).toBe(
      'Enter an email address like name@example.com.',
    );
  });
});

describe('toFieldErrors', () => {
  it('targets each API field error at its form field and drops the rest', () => {
    const fields = draftForm(complete);
    const error = new ApiError(400, 'The user is invalid.', {
      email: 'Email must be a valid email address.',
      id: 'The id in the body must match the user in the URL.',
    });

    expect(toFieldErrors(fields, error)).toEqual([
      { kind: 'server', message: 'Email must be a valid email address.', fieldTree: fields.email },
    ]);
  });
});
