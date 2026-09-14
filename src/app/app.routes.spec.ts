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
});
