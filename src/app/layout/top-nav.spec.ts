import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { stubDialogMethods } from '../../testing/dialog';
import { routes } from '../app.routes';
import { TopNav } from './top-nav';

/** Labels as they read to a screen reader, so a placeholder carries its "not available" text. */
const labels = (element: HTMLElement, selector: string) =>
  Array.from(element.querySelectorAll(selector)).map((item) =>
    item.textContent?.replace(/\s+/g, ' ').trim(),
  );

async function renderOn(url: string) {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const fixture = TestBed.createComponent(TopNav);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  await fixture.whenStable();
  return { element: fixture.nativeElement as HTMLElement, router, fixture };
}

describe('TopNav', () => {
  it('renders a named navigation landmark', async () => {
    const { element } = await renderOn('/users');

    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Primary');
  });

  it('links Users to /users and marks it as the current page', async () => {
    const { element } = await renderOn('/users');
    const current = element.querySelectorAll('nav [aria-current]');
    const usersLink = element.querySelector<HTMLAnchorElement>('nav > ul a');

    expect(usersLink?.textContent?.trim()).toBe('Users');
    expect(usersLink?.getAttribute('href')).toBe('/users');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(usersLink);
    expect(usersLink?.getAttribute('aria-current')).toBe('page');
  });

  it('links About to /about after the placeholders and marks only it current there', async () => {
    const { element } = await renderOn('/about');
    const entries = labels(element, 'nav > ul li');
    const aboutLink = element.querySelector<HTMLAnchorElement>('nav > ul a[href="/about"]');
    const current = element.querySelectorAll('nav [aria-current]');

    expect(entries.at(-1)).toBe('About');
    expect(entries.at(-2)).toBe('Settings (not available yet)');
    expect(aboutLink?.textContent?.trim()).toBe('About');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(aboutLink);
  });

  it('renders Dashboard, Reports and Settings as unavailable placeholders', async () => {
    const { element } = await renderOn('/users');
    const placeholders = Array.from(element.querySelectorAll('nav > ul button[aria-disabled]'));

    expect(placeholders.map((button) => button.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Dashboard (not available yet)',
      'Reports (not available yet)',
      'Settings (not available yet)',
    ]);
    for (const button of placeholders) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.getAttribute('type')).toBe('button');
      expect(button.hasAttribute('aria-haspopup')).toBe(false);
    }
  });

  it('stays on the current screen when a placeholder is activated', async () => {
    const { element, router, fixture } = await renderOn('/users');
    const navigate = vi.spyOn(router, 'navigateByUrl');

    for (const button of Array.from(
      element.querySelectorAll<HTMLButtonElement>('nav > ul button'),
    )) {
      button.click();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(router.url).toBe('/users');
  });

  it('hides the entry list below the md breakpoint and the Menu button from it up', async () => {
    const { element } = await renderOn('/users');
    const list = element.querySelector<HTMLUListElement>('nav > ul')!;
    const menu = element.querySelector<HTMLButtonElement>('nav > button')!;

    expect(list.className).toContain('hidden');
    expect(list.className).toContain('md:flex');
    expect(menu.textContent?.trim()).toBe('Menu');
    expect(menu.getAttribute('aria-haspopup')).toBe('dialog');
    expect(menu.className).toContain('md:hidden');
  });

  it('gives the drawer the same entries the bar shows', async () => {
    const { element } = await renderOn('/users');

    expect(labels(element, 'app-nav-drawer li')).toEqual(labels(element, 'nav > ul li'));
  });

  it('opens the drawer from the Menu button and closes it back onto the button', async () => {
    stubDialogMethods();
    const { element, fixture } = await renderOn('/users');
    const menu = element.querySelector<HTMLButtonElement>('nav > button')!;
    const dialog = element.querySelector('dialog')!;

    menu.click();
    await fixture.whenStable();
    expect(dialog.hasAttribute('open')).toBe(true);

    Array.from(dialog.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Close')!
      .click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(menu);
  });
});
