import { UserDraft } from '../user.model';
import { validateDraft, validateListQuery, validatePage, validateUser } from './user-validation';

const draft: UserDraft = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'Admin',
  status: 'active',
};

describe('validateDraft', () => {
  it('accepts a valid draft and trims text fields', () => {
    expect(validateDraft({ ...draft, name: '  Ada Lovelace ', email: ' ada@example.com' })).toEqual(
      {
        ok: true,
        value: draft,
      },
    );
  });

  it('ignores unknown properties', () => {
    expect(validateDraft({ ...draft, nickname: 'Countess' })).toEqual({ ok: true, value: draft });
  });

  it('rejects a body that is not an object', () => {
    for (const body of [null, 'user', 42, [draft]]) {
      expect(validateDraft(body)).toEqual({ ok: false, errors: { body: expect.any(String) } });
    }
  });

  it('rejects a blank name', () => {
    expect(validateDraft({ ...draft, name: '   ' })).toEqual({
      ok: false,
      errors: { name: expect.any(String) },
    });
  });

  it('rejects an invalid email', () => {
    expect(validateDraft({ ...draft, email: 'not-an-email' })).toEqual({
      ok: false,
      errors: { email: expect.any(String) },
    });
  });

  it('rejects an unknown role and status', () => {
    expect(validateDraft({ ...draft, role: 'Owner', status: 'deleted' })).toEqual({
      ok: false,
      errors: { role: expect.any(String), status: expect.any(String) },
    });
  });

  it('reports every missing field at once', () => {
    expect(validateDraft({})).toEqual({
      ok: false,
      errors: {
        name: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        status: expect.any(String),
      },
    });
  });
});

describe('validateUser', () => {
  it('accepts a body without an id or with the matching id', () => {
    expect(validateUser(draft, 'u-000042')).toEqual({ ok: true, value: draft });
    expect(validateUser({ ...draft, id: 'u-000042' }, 'u-000042')).toEqual({
      ok: true,
      value: draft,
    });
  });

  it('rejects a body whose id differs from the path', () => {
    expect(validateUser({ ...draft, id: 'u-000043' }, 'u-000042')).toEqual({
      ok: false,
      errors: { id: expect.any(String) },
    });
  });

  it('reports an id mismatch alongside field errors', () => {
    expect(validateUser({ ...draft, id: 'u-000043', role: 'Owner' }, 'u-000042')).toEqual({
      ok: false,
      errors: { id: expect.any(String), role: expect.any(String) },
    });
  });
});

describe('validatePage', () => {
  it('defaults skip to 0 and limit to 25', () => {
    expect(validatePage(null, null)).toEqual({ ok: true, value: { skip: 0, limit: 25 } });
  });

  it('parses explicit values', () => {
    expect(validatePage('50', '25')).toEqual({ ok: true, value: { skip: 50, limit: 25 } });
  });

  it('caps limit at 100', () => {
    expect(validatePage(null, '500')).toEqual({ ok: true, value: { skip: 0, limit: 100 } });
  });

  it('rejects a negative skip', () => {
    expect(validatePage('-1', null)).toEqual({ ok: false, errors: { skip: expect.any(String) } });
  });

  it('rejects a zero limit', () => {
    expect(validatePage(null, '0')).toEqual({ ok: false, errors: { limit: expect.any(String) } });
  });

  it('rejects values that are not integers', () => {
    for (const value of ['1.5', 'abc', '', '1e3', ' 1']) {
      expect(validatePage(value, value)).toEqual({
        ok: false,
        errors: { skip: expect.any(String), limit: expect.any(String) },
      });
    }
  });
});

describe('validateListQuery', () => {
  it('accepts no sort and no search', () => {
    expect(validateListQuery(null, null)).toEqual({ ok: true, value: {} });
  });

  it('parses every field in both directions', () => {
    for (const field of ['name', 'email', 'role', 'status'] as const) {
      for (const direction of ['asc', 'desc'] as const) {
        expect(validateListQuery(`${field}:${direction}`, null)).toEqual({
          ok: true,
          value: { sort: { field, direction } },
        });
      }
    }
  });

  it('rejects an unknown field, a bad direction and a malformed value', () => {
    for (const sort of ['password:asc', 'name:up', 'name', 'name:', ':asc', '', 'Name:asc']) {
      expect(validateListQuery(sort, null)).toEqual({
        ok: false,
        errors: { sort: expect.any(String) },
      });
    }
  });

  it('trims the search and treats blank text as no search', () => {
    expect(validateListQuery(null, '  Lamport ')).toEqual({ ok: true, value: { q: 'Lamport' } });
    expect(validateListQuery(null, '   ')).toEqual({ ok: true, value: {} });
    expect(validateListQuery(null, '')).toEqual({ ok: true, value: {} });
  });

  it('accepts 100 characters and rejects 101', () => {
    expect(validateListQuery(null, 'a'.repeat(100)).ok).toBe(true);
    expect(validateListQuery(null, 'a'.repeat(101))).toEqual({
      ok: false,
      errors: { q: expect.any(String) },
    });
  });

  it('reports sort and search errors together', () => {
    expect(validateListQuery('name:up', 'a'.repeat(101))).toEqual({
      ok: false,
      errors: { sort: expect.any(String), q: expect.any(String) },
    });
  });

  it('accepts every role and status value', () => {
    for (const role of ['Admin', 'Member', 'Viewer'] as const) {
      expect(validateListQuery(null, null, role, null)).toEqual({ ok: true, value: { role } });
    }
    for (const status of ['active', 'invited', 'suspended'] as const) {
      expect(validateListQuery(null, null, null, status)).toEqual({ ok: true, value: { status } });
    }
    expect(validateListQuery(null, null, 'Viewer', 'suspended')).toEqual({
      ok: true,
      value: { role: 'Viewer', status: 'suspended' },
    });
  });

  it('rejects an unknown role', () => {
    expect(validateListQuery(null, null, 'Owner', null)).toEqual({
      ok: false,
      errors: { role: expect.any(String) },
    });
  });

  it('rejects a status in the wrong case', () => {
    expect(validateListQuery(null, null, null, 'Active')).toEqual({
      ok: false,
      errors: { status: expect.any(String) },
    });
    expect(validateListQuery(null, null, 'admin', null)).toEqual({
      ok: false,
      errors: { role: expect.any(String) },
    });
  });

  it('treats empty role and status as no filter', () => {
    expect(validateListQuery(null, null, '', '')).toEqual({ ok: true, value: {} });
  });
});
