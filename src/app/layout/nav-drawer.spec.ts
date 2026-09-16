import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { routes } from '../app.routes';
import { NavDrawer, NavEntry } from './nav-drawer';

const ENTRIES: readonly NavEntry[] = [
  { label: 'Dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Reports' },
  { label: 'Settings' },
  { label: 'About', path: '/about' },
];

/** A controllable `matchMedia`, since jsdom has none. Records the queries it was asked for. */
function stubMatchMedia() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const queries: string[] = [];
  const query = {
    matches: false,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => {
      queries.push(media);
      return query;
    },
  });
  return {
    queries,
    listeners,
    change(matches: boolean) {
      query.matches = matches;
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
}

async function openDrawer(url = '/users') {
  const dialogMethods = stubDialogMethods();
  const opener = document.createElement('button');
  opener.textContent = 'Menu';
  const fallback = document.createElement('a');
  fallback.href = '/users';
  fallback.textContent = 'Orbweaver Admin';
  document.body.append(opener, fallback);
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const router = TestBed.inject(Router);
  // Navigating before the drawer exists keeps this first `NavigationEnd` out of its subscription.
  await router.navigateByUrl(url);
  const fixture = TestBed.createComponent(NavDrawer);
  fixture.componentRef.setInput('entries', ENTRIES);
  await fixture.whenStable();
  fixture.componentInstance.show(opener, fallback);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    element,
    opener,
    fallback,
    router,
    dialogMethods,
    dialog: element.querySelector('dialog')!,
    close: Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Close',
    )!,
  };
}

describe('NavDrawer', () => {
  afterEach(() => {
    document.body.querySelectorAll('button, a').forEach((control) => control.remove());
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('opens as a modal named Menu with focus on its heading', async () => {
    const { dialog, dialogMethods } = await openDrawer();
    const heading = dialog.querySelector('h2')!;

    expect(dialogMethods.showModal).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)).toBe(heading);
    expect(heading.textContent?.trim()).toBe('Menu');
    expect(document.activeElement).toBe(heading);
  });

  it('lists every entry in order, with placeholders reported as unavailable', async () => {
    const { element } = await openDrawer();
    const items = Array.from(element.querySelectorAll('li'));

    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Dashboard (not available yet)',
      'Users',
      'Reports (not available yet)',
      'Settings (not available yet)',
      'About',
    ]);
    for (const button of Array.from(element.querySelectorAll('li button'))) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
    }
    expect(
      Array.from(element.querySelectorAll<HTMLAnchorElement>('li a')).map((link) =>
        link.getAttribute('href'),
      ),
    ).toEqual(['/users', '/about']);
  });

  it('marks only the current screen with aria-current', async () => {
    const { element } = await openDrawer('/about');
    const current = element.querySelectorAll('[aria-current]');

    expect(current).toHaveLength(1);
    expect(current[0]).toBe(element.querySelector('a[href="/about"]'));
    expect(current[0].getAttribute('aria-current')).toBe('page');
  });

  it('closes with Close and returns focus to the opener', async () => {
    const { dialog, opener, close } = await openDrawer();

    close.click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const { dialog, opener } = await openDrawer();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on a backdrop click but not on a click inside it', async () => {
    const { dialog, opener } = await openDrawer();

    dialog.querySelector('ul')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.hasAttribute('open')).toBe(true);

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on navigation without taking focus back to the opener', async () => {
    const { fixture, dialog, opener, router } = await openDrawer();
    const heading = dialog.querySelector('h2')!;

    await router.navigateByUrl('/about');
    await fixture.whenStable();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).not.toBe(opener);
    expect(document.activeElement).toBe(heading);
  });

  it('closes and returns focus to the opener when the current screen is chosen', async () => {
    const { fixture, dialog, opener, router } = await openDrawer('/users');

    // The router skips a navigation to the URL already shown.
    await router.navigateByUrl('/users');
    await fixture.whenStable();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes and focuses the fallback when the viewport reaches the md breakpoint', async () => {
    const media = stubMatchMedia();
    const { fixture, dialog, fallback } = await openDrawer();

    expect(media.queries).toEqual(['(min-width: 48rem)']);
    media.change(true);
    await fixture.whenStable();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(fallback);
  });

  it('stays open while the viewport stays narrow, and stops listening once destroyed', async () => {
    const media = stubMatchMedia();
    const { fixture, dialog } = await openDrawer();

    media.change(false);
    expect(dialog.hasAttribute('open')).toBe(true);

    fixture.destroy();
    expect(media.listeners.size).toBe(0);
  });

  it('has no axe violations while open', async () => {
    const { element } = await openDrawer();

    await expectNoAxeViolations(element);
  });
});
