import { Component, ElementRef, Injector, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { ThemeSwitcher } from './layout/theme-switcher';
import { TopNav } from './layout/top-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeSwitcher, TopNav],
  host: { class: 'block min-h-screen bg-surface text-ink' },
  template: `
    <a
      href="#main"
      (click)="skipToMain($event)"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:outline-2 focus:outline-focus"
    >
      Skip to main content
    </a>
    <header class="border-b border-line-subtle bg-surface">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-1 md:gap-x-6"
      >
        <app-top-nav />
        <!-- Kept at the right end of its row, so its right-aligned menu opens on screen at any width. -->
        <app-theme-switcher class="ml-auto" />
      </div>
    </header>
    <main #main id="main" tabindex="-1" class="mx-auto max-w-7xl px-4 py-8 focus:outline-none">
      <router-outlet />
    </main>
  `,
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    const injector = inject(Injector);
    // Initial load leaves focus at the top of the document; later navigations move it to the
    // new screen so keyboard and screen reader users land on its heading.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => afterNextRender(() => this.focusScreen(), { injector }));
  }

  /** Focuses main without letting the fragment link change the URL under `<base href>`. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  private focusScreen(): void {
    const main = this.main().nativeElement;
    (main.querySelector<HTMLElement>('h1[tabindex]') ?? main).focus();
  }
}
