import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { API_LATENCY_MS } from '../core/api/api-config';
import { ApiError } from '../core/api/api-error';
import { provideUsersApi } from '../core/api/provide-users-api';
import NewUserPage from './new-user-page';
import { UsersService } from './users.service';

async function renderPage() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const users = TestBed.inject(UsersService);
  const fixture = TestBed.createComponent(NewUserPage);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const control = (label: string) => {
    const labelElement = Array.from(element.querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    return element.querySelector<HTMLInputElement & HTMLSelectElement>(`#${labelElement?.htmlFor}`);
  };
  const type = async (label: string, value: string) => {
    const input = control(label);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
  };
  const submitForm = async () => {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    // Submission resolves over several microtasks after the API answers.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };
  const fillValid = async () => {
    await type('Name', 'Grace Hopper');
    await type('Email', 'grace@example.com');
  };
  return { fixture, element, control, type, submitForm, fillValid, navigate, users };
}

describe('NewUserPage', () => {
  it('starts with empty name and email, role Member and status invited', async () => {
    const { element, control } = await renderPage();

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('New user');
    expect(control('Name')?.value).toBe('');
    expect(control('Email')?.value).toBe('');
    expect(control('Role')?.value).toBe('Member');
    expect(control('Status')?.value).toBe('invited');
  });

  it('links back to the user list', async () => {
    const { element } = await renderPage();
    const back = Array.from(element.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === 'Back to users',
    );

    expect(back?.getAttribute('href')).toBe('/users');
  });

  it('shows errors, focuses the first invalid control, and sends nothing when invalid', async () => {
    const { element, control, submitForm, users } = await renderPage();
    const create = vi.spyOn(users, 'createUser');

    await submitForm();

    expect(create).not.toHaveBeenCalled();
    expect(control('Name')?.getAttribute('aria-invalid')).toBe('true');
    expect(control('Email')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(control('Name'));
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('creates the user and opens it with the created notice', async () => {
    const { type, fillValid, submitForm, navigate, users } = await renderPage();
    const create = vi.spyOn(users, 'createUser');
    await fillValid();
    await type('Role', 'Admin');

    await submitForm();

    expect(create).toHaveBeenCalledWith({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'Admin',
      status: 'invited',
    });
    expect(navigate).toHaveBeenCalledWith(['/users', 'u-500000'], {
      state: { notice: 'created' },
    });
  });

  it('shows a 400 field error from the API on its control and keeps the values', async () => {
    const { element, control, fillValid, submitForm, navigate, users } = await renderPage();
    vi.spyOn(users, 'createUser').mockRejectedValue(
      new ApiError(400, 'The user is invalid.', { email: 'Email is already in use.' }),
    );
    await fillValid();

    await submitForm();

    const describedBy = control('Email')?.getAttribute('aria-describedby');
    expect(element.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe(
      'Email is already in use.',
    );
    expect(document.activeElement).toBe(control('Email'));
    expect(control('Name')?.value).toBe('Grace Hopper');
    expect(navigate).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows an alert and keeps the values when the create fails', async () => {
    const { element, control, fillValid, submitForm, navigate, users } = await renderPage();
    vi.spyOn(users, 'createUser').mockRejectedValue(new ApiError(500, 'Server error'));
    await fillValid();

    await submitForm();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'The user could not be created.',
    );
    expect(control('Email')?.value).toBe('grace@example.com');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('has no axe violations when empty', async () => {
    const { element } = await renderPage();

    await expectNoAxeViolations(element);
  });

  it('has no axe violations with client errors', async () => {
    const { element, submitForm } = await renderPage();
    await submitForm();

    await expectNoAxeViolations(element);
  });

  it('has no axe violations when the create fails', async () => {
    const { element, fillValid, submitForm, users } = await renderPage();
    vi.spyOn(users, 'createUser').mockRejectedValue(new ApiError(500, 'Server error'));
    await fillValid();
    await submitForm();

    await expectNoAxeViolations(element);
  });
});
