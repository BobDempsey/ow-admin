import { Component, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { ApiError } from '../core/api/api-error';
import { UsersGrid } from './users-grid';
import UsersPage from './users-page';

@Component({
  selector: 'app-users-grid',
  template: '',
})
class StubUsersGrid {
  readonly loadingChange = output<boolean>();
  readonly loaded = output<number>();
  readonly failed = output<ApiError>();
  readonly openUser = output<string>();
  readonly refresh = vi.fn();
}

async function renderPage() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.overrideComponent(UsersPage, {
    remove: { imports: [UsersGrid] },
    add: { imports: [StubUsersGrid] },
  });
  const fixture = TestBed.createComponent(UsersPage);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const grid = fixture.debugElement.query((node) => node.componentInstance instanceof StubUsersGrid)
    .componentInstance as StubUsersGrid;
  const settle = () => fixture.whenStable();
  return { fixture, element, grid, settle };
}

describe('UsersPage', () => {
  it('shows the formatted total once a page loads', async () => {
    const { element, grid, settle } = await renderPage();
    expect(element.textContent).not.toContain('users');

    grid.loaded.emit(500_000);
    await settle();

    expect(element.textContent).toContain('500,000 users');
  });

  it('announces loading only while a page is in flight', async () => {
    const { element, grid, settle } = await renderPage();
    const status = element.querySelector('[role="status"]');

    grid.loadingChange.emit(true);
    await settle();
    expect(status?.textContent?.trim()).toBe('Loading users…');

    grid.loadingChange.emit(false);
    await settle();
    expect(status?.textContent?.trim()).toBe('');
  });

  it('shows an alert with Try again when a page fails, and retries from it', async () => {
    const { element, grid, settle } = await renderPage();
    expect(element.querySelector('[role="alert"]')).toBeNull();

    grid.failed.emit(new ApiError(500, 'Server error'));
    await settle();
    const alert = element.querySelector('[role="alert"]');
    const retry = alert?.querySelector('button');
    expect(alert?.textContent).toContain('Users could not be loaded.');
    expect(retry?.textContent?.trim()).toBe('Try again');

    retry?.click();
    await settle();
    expect(grid.refresh).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(document.activeElement).toBe(element.querySelector('h1'));
  });

  it('links New user to the create screen', async () => {
    const { element } = await renderPage();
    const link = Array.from(element.querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === 'New user',
    );

    expect(link?.getAttribute('href')).toBe('/users/new');
  });

  it('opens the user detail screen', async () => {
    const { grid } = await renderPage();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    grid.openUser.emit('u-000042');

    expect(navigate).toHaveBeenCalledWith(['/users', 'u-000042']);
  });

  it('has no axe violations when loaded', async () => {
    const { element, grid, settle } = await renderPage();
    grid.loaded.emit(500_000);
    await settle();

    await expectNoAxeViolations(element);
  });

  it('has no axe violations when a page fails', async () => {
    const { element, grid, settle } = await renderPage();
    grid.failed.emit(new ApiError(500, 'Server error'));
    await settle();

    await expectNoAxeViolations(element);
  });
});
