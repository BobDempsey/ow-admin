import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PageTitleStrategy } from './page-title-strategy';

@Component({ template: '' })
class Blank {}

describe('PageTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'titled', title: 'Reports', component: Blank },
          { path: 'untitled', component: Blank },
        ]),
        { provide: TitleStrategy, useExisting: PageTitleStrategy },
      ],
    });
  });

  it('appends the app name to the route title', async () => {
    await RouterTestingHarness.create('/titled');

    expect(TestBed.inject(Title).getTitle()).toBe('Reports | Orbweaver Admin');
  });

  it('falls back to the app name when the route has no title', async () => {
    await RouterTestingHarness.create('/untitled');

    expect(TestBed.inject(Title).getTitle()).toBe('Orbweaver Admin');
  });
});
