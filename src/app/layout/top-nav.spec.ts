import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from '../app.routes';
import { TopNav } from './top-nav';

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
    const current = element.querySelectorAll('[aria-current]');
    const usersLink = element.querySelector<HTMLAnchorElement>('ul a');

    expect(usersLink?.textContent?.trim()).toBe('Users');
    expect(usersLink?.getAttribute('href')).toBe('/users');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(usersLink);
    expect(usersLink?.getAttribute('aria-current')).toBe('page');
  });

  it('links About to /about after the placeholders and marks only it current there', async () => {
    const { element } = await renderOn('/about');
    const entries = Array.from(element.querySelectorAll('ul li')).map((item) =>
      item.textContent?.replace(/\s+/g, ' ').trim(),
    );
    const aboutLink = element.querySelector<HTMLAnchorElement>('ul a[href="/about"]');
    const current = element.querySelectorAll('[aria-current]');

    expect(entries.at(-1)).toBe('About');
    expect(entries.at(-2)).toBe('Settings');
    expect(aboutLink?.textContent?.trim()).toBe('About');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(aboutLink);
  });

  it('renders Dashboard and Reports as unavailable placeholders', async () => {
    const { element } = await renderOn('/users');
    const placeholders = Array.from(element.querySelectorAll('ul button[aria-disabled]'));

    expect(placeholders.map((button) => button.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Dashboard (not available yet)',
      'Reports (not available yet)',
    ]);
    for (const button of placeholders) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.getAttribute('type')).toBe('button');
    }
  });

  it('renders Settings as a button that opens a dialog and emits itself', async () => {
    const { element, fixture } = await renderOn('/users');
    const settings = Array.from(element.querySelectorAll<HTMLButtonElement>('ul button')).find(
      (button) => button.textContent?.trim() === 'Settings',
    )!;
    const opened: HTMLElement[] = [];
    fixture.componentInstance.openSettings.subscribe((button) => opened.push(button));

    settings.click();

    expect(settings.hasAttribute('aria-disabled')).toBe(false);
    expect(settings.getAttribute('aria-haspopup')).toBe('dialog');
    expect(settings.textContent).not.toContain('not available');
    expect(opened).toEqual([settings]);
  });

  it('stays on the current screen when a placeholder is activated', async () => {
    const { element, router, fixture } = await renderOn('/users');
    const navigate = vi.spyOn(router, 'navigateByUrl');

    for (const button of Array.from(element.querySelectorAll<HTMLButtonElement>('ul button'))) {
      button.click();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
    expect(router.url).toBe('/users');
  });
});
