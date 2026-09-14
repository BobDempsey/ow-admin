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

  it('renders Dashboard, Reports and Settings as unavailable placeholders', async () => {
    const { element } = await renderOn('/users');
    const placeholders = Array.from(element.querySelectorAll('ul button'));

    expect(placeholders.map((button) => button.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Dashboard (not available yet)',
      'Reports (not available yet)',
      'Settings (not available yet)',
    ]);
    for (const button of placeholders) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.getAttribute('type')).toBe('button');
    }
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
