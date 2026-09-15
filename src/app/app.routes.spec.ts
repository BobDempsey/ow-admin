import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { PageTitleStrategy } from './core/page-title-strategy';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
  });

  it('redirects the root URL to /users', async () => {
    const harness = await RouterTestingHarness.create('/');

    expect(TestBed.inject(Location).path()).toBe('/users');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Users');
  });

  it('redirects an unknown URL to /users', async () => {
    await RouterTestingHarness.create('/no/such/screen');

    expect(TestBed.inject(Router).url).toBe('/users');
  });

  it('titles the users screen', async () => {
    await RouterTestingHarness.create('/users');

    expect(TestBed.inject(Title).getTitle()).toBe('Users | Orbweaver Admin');
  });

  it('shows and titles a user detail screen', async () => {
    const harness = await RouterTestingHarness.create('/users/u-000001');

    expect(TestBed.inject(Router).url).toBe('/users/u-000001');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('User');
    expect(TestBed.inject(Title).getTitle()).toBe('User | Orbweaver Admin');
  });

  it('shows and titles the About screen', async () => {
    const harness = await RouterTestingHarness.create('/about');

    expect(TestBed.inject(Router).url).toBe('/about');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'About this app',
    );
    expect(TestBed.inject(Title).getTitle()).toBe('About | Orbweaver Admin');
  });

  it('shows and titles the new user screen', async () => {
    const harness = await RouterTestingHarness.create('/users/new');

    expect(TestBed.inject(Router).url).toBe('/users/new');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('New user');
    expect(TestBed.inject(Title).getTitle()).toBe('New user | Orbweaver Admin');
  });
});
