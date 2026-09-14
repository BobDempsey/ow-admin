import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../testing/axe';
import { App } from './app';
import { routes } from './app.routes';
import { PageTitleStrategy } from './core/page-title-strategy';

@Component({
  template: `<h1 tabindex="-1">Other</h1>`,
})
class OtherPage {}

async function renderApp() {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([{ path: 'other', title: 'Other', component: OtherPage }, ...routes]),
      { provide: TitleStrategy, useExisting: PageTitleStrategy },
    ],
  });
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/');
  await fixture.whenStable();
  return { fixture, router, element: fixture.nativeElement as HTMLElement };
}

describe('App', () => {
  it('renders the skip link, header with nav, and main landmark on /users', async () => {
    const { element, router } = await renderApp();
    const skipLink = element.querySelector<HTMLAnchorElement>('a[href="#main"]');

    expect(router.url).toBe('/users');
    expect(element.firstElementChild).toBe(skipLink);
    expect(skipLink?.textContent?.trim()).toBe('Skip to main content');
    expect(element.querySelector('header nav[aria-label="Primary"]')).not.toBeNull();
    expect(element.querySelector('main#main h1')?.textContent).toContain('Users');
  });

  it('moves focus to main without changing the URL when the skip link is used', async () => {
    const { element, router } = await renderApp();

    element.querySelector<HTMLAnchorElement>('a[href="#main"]')?.click();

    expect(document.activeElement).toBe(element.querySelector('main'));
    expect(router.url).toBe('/users');
  });

  it('leaves focus alone on initial load', async () => {
    const { element } = await renderApp();

    expect(element.contains(document.activeElement)).toBe(false);
  });

  it('moves focus to the new screen heading after navigation', async () => {
    const { fixture, router, element } = await renderApp();

    await router.navigateByUrl('/other');
    await fixture.whenStable();

    expect(document.activeElement).toBe(element.querySelector('main h1'));
    expect(document.activeElement?.textContent).toBe('Other');
  });

  it('has no axe violations', async () => {
    const { element } = await renderApp();

    await expectNoAxeViolations(element);
  });
});
