import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, submit } from '@angular/forms/signals';
import { expectNoAxeViolations } from '../../testing/axe';
import { ApiError } from '../core/api/api-error';
import { UserDraft } from '../core/api/user.model';
import { toFieldErrors, userDraftSchema } from './user-draft-schema';
import { UserFormFields } from './user-form-fields';

@Component({
  imports: [UserFormFields],
  template: `<app-user-form-fields [fields]="fields" />`,
})
class Host {
  readonly draft = signal<UserDraft>({ name: '', email: '', role: 'Member', status: 'invited' });
  readonly fields = form(this.draft, userDraftSchema);
}

async function render() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const control = (label: string) => {
    const labelElement = Array.from(element.querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    return element.querySelector<HTMLInputElement & HTMLSelectElement>(`#${labelElement?.htmlFor}`);
  };
  const errorFor = (label: string) => {
    const describedBy = control(label)?.getAttribute('aria-describedby');
    return describedBy ? element.querySelector(`#${describedBy}`)?.textContent?.trim() : undefined;
  };
  return { fixture, host: fixture.componentInstance, element, control, errorFor };
}

describe('UserFormFields', () => {
  it('labels each control', async () => {
    const { control } = await render();

    expect(control('Name')?.type).toBe('text');
    expect(control('Email')?.type).toBe('email');
    expect(control('Role')?.tagName).toBe('SELECT');
    expect(control('Status')?.tagName).toBe('SELECT');
  });

  it('offers the closed role and status values and shows the draft', async () => {
    const { control } = await render();
    const options = (select: HTMLSelectElement | null) =>
      Array.from(select?.options ?? []).map((option) => option.value);

    expect(options(control('Role'))).toEqual(['Admin', 'Member', 'Viewer']);
    expect(options(control('Status'))).toEqual(['active', 'invited', 'suspended']);
    expect(control('Role')?.value).toBe('Member');
    expect(control('Status')?.value).toBe('invited');
  });

  it('shows no errors until a field is touched', async () => {
    const { fixture, host, control, errorFor } = await render();
    expect(control('Name')?.hasAttribute('aria-invalid')).toBe(false);
    expect(errorFor('Name')).toBeUndefined();

    host.fields.name().markAsTouched();
    await fixture.whenStable();

    expect(control('Name')?.getAttribute('aria-invalid')).toBe('true');
    expect(errorFor('Name')).toBe('Enter a name');
    expect(errorFor('Email')).toBeUndefined();
  });

  it('shows every field error after a submit attempt', async () => {
    const { fixture, host, errorFor } = await render();

    await submit(host.fields, async () => undefined);
    await fixture.whenStable();

    expect(errorFor('Name')).toBe('Enter a name');
    expect(errorFor('Email')).toBe('Enter an email address');
  });

  it('shows a 400 field error from the API on its control', async () => {
    const { fixture, host, control, errorFor } = await render();
    host.draft.set({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'Admin',
      status: 'active',
    });
    const rejected = new ApiError(400, 'The user is invalid.', {
      email: 'Email must be a valid email address',
    });

    const ok = await submit(host.fields, async (fields) => toFieldErrors(fields, rejected));
    await fixture.whenStable();

    expect(ok).toBe(false);
    expect(control('Email')?.getAttribute('aria-invalid')).toBe('true');
    expect(errorFor('Email')).toBe('Email must be a valid email address');
    expect(control('Email')?.value).toBe('grace@example.com');
  });

  it('has no axe violations without errors', async () => {
    const { element } = await render();

    await expectNoAxeViolations(element);
  });

  it('has no axe violations with errors', async () => {
    const { fixture, host, element } = await render();
    await submit(host.fields, async () => undefined);
    await fixture.whenStable();

    await expectNoAxeViolations(element);
  });
});
