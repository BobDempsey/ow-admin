import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { ApiError } from '../core/api/api-error';
import { UsersGrid } from './users-grid';
import UsersPage, { SEARCH_DEBOUNCE_MS, countLabel } from './users-page';

@Component({
  selector: 'app-users-grid',
  template: '',
})
class StubUsersGrid {
  readonly query = input('');
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

describe('countLabel', () => {
  it('uses the singular only for exactly 1, with thousands separators', () => {
    expect([0, 1, 2, 500_000].map((total) => countLabel(total, ''))).toEqual([
      '0 users',
      '1 user',
      '2 users',
      '500,000 users',
    ]);
    expect([0, 1, 2, 500_000].map((total) => countLabel(total, 'lamport'))).toEqual([
      '0 users match',
      '1 user matches',
      '2 users match',
      '500,000 users match',
    ]);
  });
});

describe('UsersPage', () => {
  it('shows the formatted total once a page loads', async () => {
    const { element, grid, settle } = await renderPage();
    expect(element.textContent).not.toMatch(/\d users/);

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

  describe('search', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
    afterEach(() => vi.useRealTimers());

    async function type(
      page: Awaited<ReturnType<typeof renderPage>>,
      text: string,
      pauseMs = SEARCH_DEBOUNCE_MS,
    ) {
      const field = page.element.querySelector<HTMLInputElement>('#users-search')!;
      field.value = text;
      field.dispatchEvent(new Event('input'));
      await page.settle();
      vi.advanceTimersByTime(pauseMs);
      await page.settle();
    }

    const statusText = (element: HTMLElement) =>
      element.querySelector('[role="status"]')?.textContent?.replace(/\s+/g, ' ').trim();

    it('has a visible Search users label and a Name or email placeholder', async () => {
      const { element } = await renderPage();
      const field = element.querySelector<HTMLInputElement>('input[type="search"]')!;
      const label = element.querySelector<HTMLLabelElement>(`label[for="${field.id}"]`);

      expect(label?.textContent?.trim()).toBe('Search users');
      expect(field.placeholder).toBe('Name or email');
    });

    it('sends the trimmed search only after typing pauses', async () => {
      const page = await renderPage();

      await type(page, 'h', 100);
      await type(page, 'hop', 100);
      await type(page, ' hopper ', SEARCH_DEBOUNCE_MS - 1);
      expect(page.grid.query()).toBe('');

      vi.advanceTimersByTime(1);
      await page.settle();
      expect(page.grid.query()).toBe('hopper');
    });

    it('does not search again for spaces around the same text', async () => {
      const page = await renderPage();
      await type(page, 'hopper');
      page.grid.loaded.emit(1_000);
      await page.settle();

      await type(page, 'hopper  ');
      page.grid.loaded.emit(900);
      await page.settle();

      expect(page.grid.query()).toBe('hopper');
      // A new search would announce this load; the same search does not.
      expect(statusText(page.element)).toBe('1,000 users match');
    });

    it('shows and announces the match count once the search loads', async () => {
      const page = await renderPage();
      page.grid.loaded.emit(500_000);
      await type(page, 'lamport');

      page.grid.loadingChange.emit(true);
      await page.settle();
      expect(statusText(page.element)).toBe('Loading users…');
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(17_241);
      await page.settle();

      expect(page.element.textContent).toContain('17,241 users match');
      expect(statusText(page.element)).toBe('17,241 users match');
    });

    it('shows and announces a single match in the singular', async () => {
      const page = await renderPage();
      await type(page, 'quartermaine');

      page.grid.loaded.emit(1);
      await page.settle();

      expect(page.element.querySelector('h1 + p')?.textContent?.trim()).toBe('1 user matches');
      expect(statusText(page.element)).toBe('1 user matches');
    });

    it('hides the announced result visually but keeps Loading users… visible', async () => {
      const page = await renderPage();
      const status = page.element.querySelector('[role="status"]')!;
      await type(page, 'lamport');

      page.grid.loadingChange.emit(true);
      await page.settle();
      expect(status.querySelector('.sr-only')).toBeNull();
      expect(statusText(page.element)).toBe('Loading users…');

      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(17_241);
      await page.settle();
      expect(status.querySelector('span.sr-only')?.textContent?.trim()).toBe('17,241 users match');
      expect(status.classList).toContain('min-h-6');
    });

    it('keeps the total worded for the last loaded result until the search loads', async () => {
      const page = await renderPage();
      page.grid.loaded.emit(500_000);
      await page.settle();

      await type(page, 'lamport');

      expect(page.element.textContent).toContain('500,000 users');
      expect(page.element.textContent).not.toContain('users match');
    });

    it('says No users match when nothing matches', async () => {
      const page = await renderPage();
      await type(page, 'no-such-user');

      page.grid.loaded.emit(0);
      await page.settle();

      expect(page.element.textContent).toContain('0 users match');
      expect(statusText(page.element)).toBe('No users match');
    });

    it('shows and announces all users again when the search is cleared', async () => {
      const page = await renderPage();
      await type(page, 'lamport');
      page.grid.loaded.emit(17_241);
      await page.settle();

      await type(page, '');
      page.grid.loaded.emit(500_000);
      await page.settle();

      expect(page.grid.query()).toBe('');
      expect(page.element.textContent).toContain('500,000 users');
      expect(page.element.textContent).not.toContain('match');
      expect(statusText(page.element)).toBe('500,000 users');
    });

    it('does not announce a page load that no search started', async () => {
      const page = await renderPage();
      await type(page, 'lamport');
      page.grid.loaded.emit(17_241);
      await page.settle();

      page.grid.loadingChange.emit(true);
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(17_241);
      await page.settle();

      expect(statusText(page.element)).toBe('');
    });

    it('has no axe violations with a search and its result', async () => {
      const page = await renderPage();
      await type(page, 'lamport');
      page.grid.loaded.emit(17_241);
      await page.settle();

      vi.useRealTimers();
      await expectNoAxeViolations(page.element);
    });
  });

  it('has no axe violations when a page fails', async () => {
    const { element, grid, settle } = await renderPage();
    grid.failed.emit(new ApiError(500, 'Server error'));
    await settle();

    await expectNoAxeViolations(element);
  });
});
