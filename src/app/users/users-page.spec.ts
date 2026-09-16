import { Component, effect, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { ApiError } from '../core/api/api-error';
import { EMPTY_LIST_QUERY, ListQuery } from './users-datasource';
import { UsersGrid } from './users-grid';
import UsersPage, { SEARCH_DEBOUNCE_MS, countLabel } from './users-page';

@Component({
  selector: 'app-users-grid',
  template: '',
})
class StubUsersGrid {
  readonly query = input<ListQuery>(EMPTY_LIST_QUERY);
  readonly loadingChange = output<boolean>();
  readonly loaded = output<number>();
  readonly failed = output<ApiError>();
  readonly openUser = output<string>();
  readonly refresh = vi.fn();
  /** Every query the grid has been given, one entry per change the grid would see. */
  readonly queries: ListQuery[] = [];

  constructor() {
    effect(() => this.queries.push(this.query()));
  }
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

/** Types into the search field and waits out the debounce. Needs fake timers. */
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

describe('countLabel', () => {
  it('uses the singular only for exactly 1, with thousands separators', () => {
    expect([0, 1, 2, 500_000].map((total) => countLabel(total, false))).toEqual([
      '0 users',
      '1 user',
      '2 users',
      '500,000 users',
    ]);
    expect([0, 1, 2, 500_000].map((total) => countLabel(total, true))).toEqual([
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
    const total = Array.from(element.querySelectorAll('p')).find(
      (paragraph) => paragraph.textContent?.trim() === '500,000 users',
    );
    expect(total?.classList).toContain('tabular-nums');
  });

  it('announces loading only while a page is in flight', async () => {
    const { element, grid, settle } = await renderPage();
    const status = element.querySelector('[role="status"]');

    grid.loadingChange.emit(true);
    await settle();
    expect(status?.textContent?.trim()).toBe('Loading users…');
    // Skeleton rows show the load, so the text is for screen readers only.
    expect(status?.querySelector('.sr-only')?.textContent?.trim()).toBe('Loading users…');

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

  it('describes the screen under the title row, which keeps the total and New user', async () => {
    const { element, grid, settle } = await renderPage();
    grid.loaded.emit(12);
    await settle();
    const titleRow = element.querySelector('h1')?.parentElement;

    expect(titleRow?.nextElementSibling?.textContent?.trim()).toBe(
      'Find a user by name or email, or narrow the list by role and status.',
    );
    expect(titleRow?.textContent).toContain('12 users');
    expect(titleRow?.querySelector('a')?.textContent?.trim()).toBe('New user');
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
      expect(page.grid.query().q).toBe('');

      vi.advanceTimersByTime(1);
      await page.settle();
      expect(page.grid.query().q).toBe('hopper');
    });

    it('does not search again for spaces around the same text', async () => {
      const page = await renderPage();
      await type(page, 'hopper');
      page.grid.loaded.emit(1_000);
      await page.settle();

      await type(page, 'hopper  ');
      page.grid.loaded.emit(900);
      await page.settle();

      expect(page.grid.query().q).toBe('hopper');
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

    it('hides both the announced result and Loading users… visually', async () => {
      const page = await renderPage();
      const status = page.element.querySelector('[role="status"]')!;
      await type(page, 'lamport');

      page.grid.loadingChange.emit(true);
      await page.settle();
      expect(status.querySelector('span.sr-only')?.textContent?.trim()).toBe('Loading users…');
      expect(statusText(page.element)).toBe('Loading users…');

      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(17_241);
      await page.settle();
      expect(status.querySelector('span.sr-only')?.textContent?.trim()).toBe('17,241 users match');
      expect(status.classList).not.toContain('min-h-6');
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

      expect(page.grid.query().q).toBe('');
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

  describe('filters', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
    afterEach(() => vi.useRealTimers());

    const filter = (element: HTMLElement, id: string) =>
      element.querySelector<HTMLSelectElement>(`#${id}`)!;

    async function choose(page: Awaited<ReturnType<typeof renderPage>>, id: string, value: string) {
      const field = filter(page.element, id);
      field.focus();
      field.value = value;
      field.dispatchEvent(new Event('change'));
      await page.settle();
    }

    it('labels both dropdowns and starts each on its Any option', async () => {
      const { element } = await renderPage();
      const role = filter(element, 'users-role');
      const status = filter(element, 'users-status');
      const optionsOf = (select: HTMLSelectElement) =>
        Array.from(select.options).map((option) => `${option.value}:${option.textContent?.trim()}`);

      expect(element.querySelector(`label[for="${role.id}"]`)?.textContent?.trim()).toBe('Role');
      expect(element.querySelector(`label[for="${status.id}"]`)?.textContent?.trim()).toBe(
        'Status',
      );
      expect(optionsOf(role)).toEqual([
        ':Any role',
        'Admin:Admin',
        'Member:Member',
        'Viewer:Viewer',
      ]);
      expect(optionsOf(status)).toEqual([
        ':Any status',
        'active:active',
        'invited:invited',
        'suspended:suspended',
      ]);
      expect([role.value, status.value]).toEqual(['', '']);
    });

    it('applies a filter without waiting for the search debounce', async () => {
      const page = await renderPage();

      await choose(page, 'users-status', 'suspended');

      expect(page.grid.query()).toEqual({ q: '', status: 'suspended' });
    });

    it('drops a filter when its Any option is chosen', async () => {
      const page = await renderPage();
      await choose(page, 'users-role', 'Admin');
      expect(page.grid.query()).toEqual({ q: '', role: 'Admin' });

      await choose(page, 'users-role', '');

      expect(page.grid.query()).toEqual({ q: '' });
    });

    it('combines both filters with a search', async () => {
      const page = await renderPage();

      await type(page, 'hopper');
      await choose(page, 'users-role', 'Admin');
      await choose(page, 'users-status', 'active');

      expect(page.grid.query()).toEqual({ q: 'hopper', role: 'Admin', status: 'active' });
    });

    it('words the total as matches and announces it, leaving focus on the dropdown', async () => {
      const page = await renderPage();
      page.grid.loaded.emit(500_000);
      await page.settle();

      await choose(page, 'users-status', 'invited');
      page.grid.loadingChange.emit(true);
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(64_935);
      await page.settle();

      expect(page.element.textContent).toContain('64,935 users match');
      expect(statusText(page.element)).toBe('64,935 users match');
      expect(document.activeElement).toBe(filter(page.element, 'users-status'));
    });

    it('says no users match when a filter alone matches nothing', async () => {
      const page = await renderPage();

      await choose(page, 'users-role', 'Viewer');
      page.grid.loaded.emit(0);
      await page.settle();

      expect(page.element.textContent).toContain('0 users match');
      expect(statusText(page.element)).toBe('No users match');
    });

    it('returns the total to plain users once the last filter is cleared', async () => {
      const page = await renderPage();
      await choose(page, 'users-role', 'Admin');
      page.grid.loaded.emit(25_000);
      await page.settle();
      expect(page.element.textContent).toContain('25,000 users match');

      await choose(page, 'users-role', '');
      page.grid.loaded.emit(500_000);
      await page.settle();

      expect(page.element.textContent).toContain('500,000 users');
      expect(page.element.textContent).not.toContain('match');
      expect(statusText(page.element)).toBe('500,000 users');
    });

    it('has no axe violations with a filter and its result', async () => {
      const page = await renderPage();
      await choose(page, 'users-role', 'Admin');
      page.grid.loaded.emit(25_000);
      await page.settle();

      vi.useRealTimers();
      await expectNoAxeViolations(page.element);
    });
  });

  describe('filter chips', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
    afterEach(() => vi.useRealTimers());

    async function choose(page: Awaited<ReturnType<typeof renderPage>>, id: string, value: string) {
      const field = page.element.querySelector<HTMLSelectElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event('change'));
      await page.settle();
    }

    const chipButtons = (element: HTMLElement) =>
      Array.from(
        element.querySelectorAll<HTMLButtonElement>('ul[aria-label="Active filters"] button'),
      );
    const chipNames = (element: HTMLElement) =>
      chipButtons(element).map((chip) => chip.textContent?.replace(/\s+/g, ' ').trim());
    const clearAllButton = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Clear all',
      );
    const chip = (element: HTMLElement, label: string) =>
      chipButtons(element).find((button) => button.textContent?.includes(label))!;
    const searchField = (element: HTMLElement) =>
      element.querySelector<HTMLInputElement>('#users-search')!;
    const select = (element: HTMLElement, id: string) =>
      element.querySelector<HTMLSelectElement>(`#${id}`)!;

    it('keeps Search users, Role and Status in the filter group and Table settings outside', async () => {
      const { element } = await renderPage();
      const group = element.querySelector('[role="search"]');
      const settings = Array.from(element.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Table settings',
      )!;

      expect(group?.getAttribute('aria-label')).toBe('Filter users');
      expect(
        Array.from(group?.querySelectorAll('input, select') ?? []).map((control) => control.id),
      ).toEqual(['users-search', 'users-role', 'users-status']);
      expect(group?.contains(settings)).toBe(false);
      expect(group?.compareDocumentPosition(settings)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('shows no chip and no Clear all without a filter', async () => {
      const { element } = await renderPage();

      expect(chipButtons(element)).toEqual([]);
      expect(clearAllButton(element)).toBeUndefined();
    });

    it('shows a chip for each applied filter in control order, then Clear all', async () => {
      const page = await renderPage();

      await choose(page, 'users-role', 'Admin');
      await type(page, 'hopper');

      expect(chipNames(page.element)).toEqual([
        'Remove filter Search: hopper',
        'Remove filter Role: Admin',
      ]);
      expect(clearAllButton(page.element)).toBeDefined();
    });

    it('shows no chip for search text still waiting on the pause', async () => {
      const page = await renderPage();

      await type(page, 'hop', SEARCH_DEBOUNCE_MS - 1);

      expect(chipButtons(page.element)).toEqual([]);
    });

    it('removes the role filter and focuses the Status chip that took its place', async () => {
      const page = await renderPage();
      await choose(page, 'users-role', 'Admin');
      await choose(page, 'users-status', 'suspended');

      chip(page.element, 'Role: Admin').click();
      await page.settle();

      expect(page.grid.query()).toEqual({ q: '', status: 'suspended' });
      expect(select(page.element, 'users-role').value).toBe('');
      expect(document.activeElement).toBe(chip(page.element, 'Status: suspended'));
    });

    it('removes the last chip in the row and focuses the new last chip', async () => {
      const page = await renderPage();
      await type(page, 'hopper');
      await choose(page, 'users-role', 'Admin');

      chip(page.element, 'Role: Admin').click();
      await page.settle();

      expect(page.grid.query()).toEqual({ q: 'hopper' });
      expect(document.activeElement).toBe(chip(page.element, 'Search: hopper'));
    });

    it('removes the search at once and focuses Search users when no chip is left', async () => {
      const page = await renderPage();
      await type(page, 'hopper');

      chip(page.element, 'Search: hopper').click();
      await page.settle();

      expect(page.grid.query()).toEqual({ q: '' });
      expect(searchField(page.element).value).toBe('');
      expect(document.activeElement).toBe(searchField(page.element));
      expect(chipButtons(page.element)).toEqual([]);
      expect(clearAllButton(page.element)).toBeUndefined();

      // Nothing is left waiting on the pause to bring the search back.
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      await page.settle();
      expect(page.grid.query()).toEqual({ q: '' });
    });

    it('announces the result after a chip is removed', async () => {
      const page = await renderPage();
      await choose(page, 'users-status', 'suspended');
      page.grid.loaded.emit(25_000);
      await page.settle();

      chip(page.element, 'Status: suspended').click();
      await page.settle();
      page.grid.loadingChange.emit(true);
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(500_000);
      await page.settle();

      expect(statusText(page.element)).toBe('500,000 users');
    });

    it('clears every filter with one query change and focuses Search users', async () => {
      const page = await renderPage();
      await type(page, 'hopper');
      await choose(page, 'users-role', 'Admin');
      await choose(page, 'users-status', 'active');
      const before = page.grid.queries.length;

      clearAllButton(page.element)?.click();
      await page.settle();

      expect(page.grid.queries.slice(before)).toEqual([{ q: '' }]);
      expect(searchField(page.element).value).toBe('');
      expect(select(page.element, 'users-role').value).toBe('');
      expect(select(page.element, 'users-status').value).toBe('');
      expect(chipButtons(page.element)).toEqual([]);
      expect(clearAllButton(page.element)).toBeUndefined();
      expect(document.activeElement).toBe(searchField(page.element));

      page.grid.loadingChange.emit(true);
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(500_000);
      await page.settle();
      expect(statusText(page.element)).toBe('500,000 users');
    });

    it('has no axe violations with chips shown', async () => {
      const page = await renderPage();
      await type(page, 'hopper');
      await choose(page, 'users-role', 'Admin');

      vi.useRealTimers();
      await expectNoAxeViolations(page.element);
    });
  });

  describe('empty result', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
    afterEach(() => vi.useRealTimers());

    const emptyState = (element: HTMLElement) => element.querySelector('app-empty-users-overlay');
    const clearFilters = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Clear filters',
      );

    async function loadEmptySearch(page: Awaited<ReturnType<typeof renderPage>>) {
      await type(page, 'no-such-user');
      const status = page.element.querySelector<HTMLSelectElement>('#users-status')!;
      status.value = 'suspended';
      status.dispatchEvent(new Event('change'));
      await page.settle();
      page.grid.loadingChange.emit(true);
      page.grid.loadingChange.emit(false);
      page.grid.loaded.emit(0);
      await page.settle();
    }

    it('shows No users match with Clear filters after a search and filter match nothing', async () => {
      const page = await renderPage();
      await loadEmptySearch(page);

      expect(emptyState(page.element)?.querySelector('h2')?.textContent?.trim()).toBe(
        'No users match',
      );
      expect(clearFilters(page.element)).toBeDefined();
      expect(page.element.textContent).toContain('0 users match');
    });

    it('clears every filter from Clear filters and focuses Search users', async () => {
      const page = await renderPage();
      await loadEmptySearch(page);
      const before = page.grid.queries.length;

      clearFilters(page.element)?.click();
      await page.settle();

      expect(page.grid.queries.slice(before)).toEqual([{ q: '' }]);
      const field = page.element.querySelector<HTMLInputElement>('#users-search')!;
      expect(field.value).toBe('');
      expect(page.element.querySelector<HTMLSelectElement>('#users-status')?.value).toBe('');
      expect(document.activeElement).toBe(field);
    });

    it('hides the empty state while the next page loads', async () => {
      const page = await renderPage();
      await loadEmptySearch(page);

      page.grid.loadingChange.emit(true);
      await page.settle();

      expect(emptyState(page.element)).toBeNull();
    });

    it('says No users yet, with no button, when nothing is filtered and there are no users', async () => {
      const page = await renderPage();
      page.grid.loaded.emit(0);
      await page.settle();

      expect(emptyState(page.element)?.querySelector('h2')?.textContent?.trim()).toBe(
        'No users yet',
      );
      expect(clearFilters(page.element)).toBeUndefined();
    });

    it('shows no empty state while users are listed', async () => {
      const page = await renderPage();
      page.grid.loaded.emit(500_000);
      await page.settle();

      expect(emptyState(page.element)).toBeNull();
    });
  });

  describe('table settings', () => {
    const settingsButton = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Table settings',
      )!;

    it('offers the button beside the search field, marked as opening a dialog', async () => {
      const { element } = await renderPage();
      const button = settingsButton(element);
      const search = element.querySelector('#users-search')!;

      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button.getAttribute('type')).toBe('button');
      // Same toolbar row as the filter group, but outside it.
      expect(button.closest('div')).toBe(search.closest('[role="search"]')?.parentElement);
    });

    it('opens the dialog and returns focus to the button on Close', async () => {
      stubDialogMethods();
      const { element, settle } = await renderPage();
      const button = settingsButton(element);
      const dialog = element.querySelector('dialog')!;

      button.click();
      await settle();
      expect(dialog.hasAttribute('open')).toBe(true);
      expect(dialog.querySelector('h2')?.textContent?.trim()).toBe('Table settings');
      expect(document.activeElement).toBe(dialog.querySelector('h2'));

      Array.from(dialog.querySelectorAll('button'))
        .find((candidate) => candidate.textContent?.trim() === 'Close')!
        .click();

      expect(dialog.hasAttribute('open')).toBe(false);
      expect(document.activeElement).toBe(button);
    });

    it('closes on Escape and returns focus to the button', async () => {
      stubDialogMethods();
      const { element, settle } = await renderPage();
      const button = settingsButton(element);
      const dialog = element.querySelector('dialog')!;
      button.click();
      await settle();

      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

      expect(dialog.hasAttribute('open')).toBe(false);
      expect(document.activeElement).toBe(button);
    });
  });

  it('has no axe violations when a page fails', async () => {
    const { element, grid, settle } = await renderPage();
    grid.failed.emit(new ApiError(500, 'Server error'));
    await settle();

    await expectNoAxeViolations(element);
  });
});
