import { Component, ElementRef, Injector, afterNextRender, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { AiChatDrawer } from './layout/ai-chat-drawer';
import { ThemeSwitcher } from './layout/theme-switcher';
import { TopNav } from './layout/top-nav';

@Component({
  selector: 'app-root',
  imports: [AiChatDrawer, RouterOutlet, ThemeSwitcher, TopNav],
  host: { class: 'block min-h-screen bg-surface text-ink' },
  template: `
    <a
      href="#main"
      (click)="skipToMain($event)"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:outline-2 focus:outline-focus"
    >
      Skip to main content
    </a>
    <header class="bg-header shadow-[inset_0_-1px_0_var(--color-header-line)]">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-1 gap-y-1 px-4 py-1 md:gap-x-6"
      >
        <app-top-nav>
          <!-- Pushed to the right end of the row, so the theme's right-aligned menu opens on screen at any width. -->
          <div class="ml-auto flex items-center gap-x-1">
            <app-ai-chat-drawer />
            <app-theme-switcher />
          </div>
        </app-top-nav>
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
