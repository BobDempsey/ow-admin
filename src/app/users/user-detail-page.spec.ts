import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { API_LATENCY_MS } from '../core/api/api-config';
import { ApiError } from '../core/api/api-error';
import { seedUser } from '../core/api/in-memory/user-seed';
import { provideUsersApi } from '../core/api/provide-users-api';
import UserDetailPage from './user-detail-page';
import { UsersService } from './users.service';

const ID = 'u-000042';
const seeded = seedUser(42);

async function renderPage(
  options: { id?: string; state?: unknown; beforeCreate?: () => void } = {},
) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
  });
  const dialogStubs = stubDialogMethods();
  vi.spyOn(TestBed.inject(Location), 'getState').mockReturnValue(options.state ?? null);
  const users = TestBed.inject(UsersService);
  options.beforeCreate?.();
  const fixture = TestBed.createComponent(UserDetailPage);
  fixture.componentRef.setInput('id', options.id ?? ID);
  const element = fixture.nativeElement as HTMLElement;

  const settle = async () => {
    // API calls resolve over a few microtasks, and submission over a few more after them.
    for (let pass = 0; pass < 3; pass++) {
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
    }
    await fixture.whenStable();
  };
  const control = (label: string) => {
    const labelElement = Array.from(element.querySelectorAll('label')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    return labelElement
      ? element.querySelector<HTMLInputElement & HTMLSelectElement>(`#${labelElement.htmlFor}`)
      : null;
  };
  const button = (name: string) =>
    Array.from(element.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === name,
    );
  const type = async (label: string, value: string) => {
    const input = control(label)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const saveForm = async () => {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle();
  };
  const click = async (name: string) => {
    button(name)?.click();
    await settle();
  };
  const status = () => element.querySelector('[role="status"]')?.textContent?.trim();
  const alert = () => element.querySelector('[role="alert"]')?.textContent?.trim();
  const heading = () => element.querySelector('h1');
  const dialogOpen = () => element.querySelector('dialog')?.open ?? false;

  await settle();
  return {
    fixture,
    element,
    users,
    settle,
    control,
    button,
    type,
    saveForm,
    click,
    status,
    alert,
    heading,
    dialogOpen,
    ...dialogStubs,
  };
}

describe('UserDetailPage', () => {
  describe('loading', () => {
    it('announces loading while the user is in flight', async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideUsersApi(), { provide: API_LATENCY_MS, useValue: 0 }],
      });
      vi.spyOn(TestBed.inject(UsersService), 'loadUser').mockReturnValue(new Promise(() => {}));
      const fixture = TestBed.createComponent(UserDetailPage);
      fixture.componentRef.setInput('id', ID);
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBe('Loading user…');
      expect(element.querySelector('h1')?.textContent?.trim()).toBe('User');
      expect(element.querySelector('form')).toBeNull();
    });

    it('shows the loaded user in the form, titled with their name', async () => {
      const { element, control, heading, status } = await renderPage();

      expect(heading()?.textContent?.trim()).toBe(seeded.name);
      expect(element.textContent).toContain(`ID ${ID}`);
      expect(control('Name')?.value).toBe(seeded.name);
      expect(control('Email')?.value).toBe(seeded.email);
      expect(control('Role')?.value).toBe(seeded.role);
      expect(control('Status')?.value).toBe(seeded.status);
      expect(status()).toBe('');
    });

    it('links back to the user list', async () => {
      const { element } = await renderPage();
      const back = Array.from(element.querySelectorAll('a')).find(
        (link) => link.textContent?.trim() === 'Back to users',
      );

      expect(back?.getAttribute('href')).toBe('/users');
    });

    it('says when the user does not exist, without a form', async () => {
      const { element, heading } = await renderPage({ id: 'u-999999' });

      expect(heading()?.textContent?.trim()).toBe('User not found');
      expect(element.textContent).toContain('No user exists with the id u-999999.');
      expect(element.querySelector('form')).toBeNull();
      expect(element.querySelector('[role="alert"]')).toBeNull();
    });

    it('shows an alert when loading fails, and Try again loads the user', async () => {
      let loadUser: ReturnType<typeof vi.spyOn>;
      const page = await renderPage({
        beforeCreate: () => {
          loadUser = vi
            .spyOn(TestBed.inject(UsersService), 'loadUser')
            .mockRejectedValueOnce(new ApiError(500, 'Server error'));
        },
      });
      expect(page.alert()).toContain('The user could not be loaded.');
      expect(page.element.querySelector('form')).toBeNull();

      await page.click('Try again');

      expect(loadUser!).toHaveBeenCalledTimes(2);
      expect(page.alert()).toBeUndefined();
      expect(page.control('Name')?.value).toBe(seeded.name);
      expect(document.activeElement).toBe(page.heading());
    });

    it('announces a user that was just created', async () => {
      const { status } = await renderPage({ state: { notice: 'created', navigationId: 2 } });

      expect(status()).toBe('User created.');
    });
  });

  describe('editing', () => {
    it('saves with the held ETag, announces it, and holds the new ETag without a new GET', async () => {
      const page = await renderPage();
      const loadUser = vi.spyOn(page.users, 'loadUser');
      const saveUser = vi.spyOn(page.users, 'saveUser');

      await page.type('Name', 'Grace Hopper');
      await page.saveForm();

      expect(saveUser).toHaveBeenLastCalledWith(
        ID,
        { name: 'Grace Hopper', email: seeded.email, role: seeded.role, status: seeded.status },
        `"${ID}.1"`,
      );
      expect(page.status()).toBe('User saved.');
      expect(page.heading()?.textContent?.trim()).toBe('Grace Hopper');

      await page.type('Email', 'grace@example.com');
      await page.saveForm();

      expect(saveUser).toHaveBeenLastCalledWith(ID, expect.anything(), `"${ID}.2"`);
      expect(page.status()).toBe('User saved.');
      expect(loadUser).not.toHaveBeenCalled();
    });

    it('shows errors and sends nothing when the form is invalid', async () => {
      const page = await renderPage();
      const saveUser = vi.spyOn(page.users, 'saveUser');

      await page.type('Name', ' ');
      await page.type('Email', 'grace@');
      await page.saveForm();

      expect(saveUser).not.toHaveBeenCalled();
      expect(page.control('Name')?.getAttribute('aria-invalid')).toBe('true');
      expect(page.control('Email')?.getAttribute('aria-invalid')).toBe('true');
      expect(document.activeElement).toBe(page.control('Name'));
    });

    it('restores the loaded values on Cancel without a request', async () => {
      const page = await renderPage();
      const saveUser = vi.spyOn(page.users, 'saveUser');
      await page.type('Name', 'Grace Hopper');
      await page.type('Role', 'Viewer');

      await page.click('Cancel');

      expect(page.control('Name')?.value).toBe(seeded.name);
      expect(page.control('Role')?.value).toBe(seeded.role);
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('shows a 400 field error from the API on its control and keeps the values', async () => {
      const page = await renderPage();
      vi.spyOn(page.users, 'saveUser').mockRejectedValue(
        new ApiError(400, 'The user is invalid.', { email: 'Email is already in use.' }),
      );
      await page.type('Email', 'grace@example.com');

      await page.saveForm();

      const describedBy = page.control('Email')?.getAttribute('aria-describedby');
      expect(page.element.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe(
        'Email is already in use.',
      );
      expect(page.control('Email')?.value).toBe('grace@example.com');
      expect(document.activeElement).toBe(page.control('Email'));
      expect(page.alert()).toBeUndefined();
    });

    it('shows an alert and keeps the values when the save fails', async () => {
      const page = await renderPage();
      vi.spyOn(page.users, 'saveUser').mockRejectedValue(new ApiError(500, 'Server error'));
      await page.type('Name', 'Grace Hopper');

      await page.saveForm();

      expect(page.alert()).toContain('The user could not be saved.');
      expect(page.control('Name')?.value).toBe('Grace Hopper');
    });

    it('ignores Save while a save is in flight', async () => {
      const page = await renderPage();
      const saveUser = vi.spyOn(page.users, 'saveUser').mockReturnValue(new Promise(() => {}));
      const form = page.element.querySelector('form')!;

      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await page.fixture.whenStable();
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await page.fixture.whenStable();

      expect(saveUser).toHaveBeenCalledOnce();
      expect(page.status()).toBe('Saving…');
    });
  });

  describe('conflicts', () => {
    const nextStatus =
      seeded.status === 'active' ? 'invited' : seeded.status === 'invited' ? 'suspended' : 'active';

    it('announces a simulated edit, and Save then opens the conflict dialog', async () => {
      const page = await renderPage();

      await page.click('Simulate an edit by another admin');
      expect(page.status()).toBe('Another admin changed this user. Save to see the conflict.');

      await page.saveForm();

      expect(page.showModal).toHaveBeenCalledOnce();
      expect(page.dialogOpen()).toBe(true);
    });

    it('keeps the edited values and focuses Save on Keep editing, without a request', async () => {
      const page = await renderPage();
      await page.click('Simulate an edit by another admin');
      await page.type('Name', 'Grace Hopper');
      await page.saveForm();
      const loadUser = vi.spyOn(page.users, 'loadUser');
      const saveUser = vi.spyOn(page.users, 'saveUser');

      await page.click('Keep editing');

      expect(page.dialogOpen()).toBe(false);
      expect(page.control('Name')?.value).toBe('Grace Hopper');
      expect(document.activeElement).toBe(page.button('Save'));
      expect(loadUser).not.toHaveBeenCalled();
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('reloads the latest values on Reload, discarding the edit', async () => {
      const page = await renderPage();
      await page.click('Simulate an edit by another admin');
      await page.type('Name', 'Grace Hopper');
      await page.saveForm();

      await page.click('Reload');

      expect(page.dialogOpen()).toBe(false);
      expect(page.control('Name')?.value).toBe(seeded.name);
      expect(page.control('Status')?.value).toBe(nextStatus);

      await page.type('Name', 'Grace Hopper');
      await page.saveForm();
      expect(page.status()).toBe('User saved.');
    });

    it('saves the edited values over the other change on Overwrite', async () => {
      const page = await renderPage();
      await page.click('Simulate an edit by another admin');
      await page.type('Name', 'Grace Hopper');
      await page.saveForm();

      await page.click('Overwrite');

      expect(page.dialogOpen()).toBe(false);
      expect(page.status()).toBe('User saved.');
      const current = await page.users.loadUser(ID);
      expect(current.data).toEqual({ ...seeded, name: 'Grace Hopper' });
      expect(current.etag).toBe(`"${ID}.3"`);
    });

    it('opens the dialog again when the overwrite also conflicts', async () => {
      const page = await renderPage();
      vi.spyOn(page.users, 'saveUser').mockRejectedValue(new ApiError(412, 'Precondition Failed'));
      await page.saveForm();

      await page.click('Overwrite');

      expect(page.showModal).toHaveBeenCalledTimes(2);
      expect(page.dialogOpen()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when loaded', async () => {
      const { element } = await renderPage();

      await expectNoAxeViolations(element);
    });

    it('has no axe violations when not found', async () => {
      const { element } = await renderPage({ id: 'u-999999' });

      await expectNoAxeViolations(element);
    });

    it('has no axe violations when loading fails', async () => {
      const { element } = await renderPage({
        beforeCreate: () =>
          vi
            .spyOn(TestBed.inject(UsersService), 'loadUser')
            .mockRejectedValue(new ApiError(500, 'Server error')),
      });

      await expectNoAxeViolations(element);
    });

    it('has no axe violations when saving fails', async () => {
      const page = await renderPage();
      vi.spyOn(page.users, 'saveUser').mockRejectedValue(new ApiError(500, 'Server error'));
      await page.saveForm();

      await expectNoAxeViolations(page.element);
    });
  });
});
