import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The About screen: what the app does, how its data behaves, and how it was built. */
@Component({
  selector: 'app-about-page',
  imports: [RouterLink],
  template: `
    <h1 tabindex="-1" class="text-3xl font-semibold text-ink focus:outline-none">About this app</h1>
    <p class="mt-3 max-w-prose text-lg text-ink-muted">
      An admin screen for managing users, built as a take-home exercise.
    </p>

    <div class="mt-10 grid gap-10 md:grid-cols-2">
      <section aria-labelledby="about-what">
        <h2 id="about-what" class="text-xl font-semibold text-ink">What it does</h2>
        <p class="mt-2 text-ink-muted">
          Page through 500,000 users, create new ones, and view or edit any user.
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a
            routerLink="/users"
            class="inline-flex min-h-11 items-center rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >Go to users</a
          >
          <a
            routerLink="/users/new"
            class="inline-flex min-h-11 items-center rounded border border-line px-4 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >Create a user</a
          >
        </div>
      </section>

      <section aria-labelledby="about-data">
        <h2 id="about-data" class="text-xl font-semibold text-ink">How the data works</h2>
        <p class="mt-2 text-ink-muted">
          The API runs in your browser over an in-memory store of 500,000 users, so data resets on
          reload. Every save sends an ETag, and a stale one gets a 412 conflict.
        </p>
      </section>

      <section aria-labelledby="about-conflict">
        <h2 id="about-conflict" class="text-xl font-semibold text-ink">Try an edit conflict</h2>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-ink-muted">
          <li>Open any user from the list.</li>
          <li>Select "Simulate an edit by another admin".</li>
          <li>Select Save.</li>
          <li>Choose Keep editing, Reload or Overwrite.</li>
        </ol>
      </section>

      <section aria-labelledby="about-accessibility">
        <h2 id="about-accessibility" class="text-xl font-semibold text-ink">Accessibility</h2>
        <p class="mt-2 text-ink-muted">
          Built for WCAG 2.2 AA and tested with axe, Playwright and Vitest. The full report is in
          <code class="rounded bg-surface-muted px-1 text-sm text-ink">docs/accessibility.md</code>.
        </p>
      </section>
    </div>

    <section aria-labelledby="about-development" class="mt-10">
      <h2 id="about-development" class="text-xl font-semibold text-ink">Development</h2>
      <ul class="mt-2 grid list-disc gap-x-10 gap-y-1 pl-5 text-ink-muted md:grid-cols-2">
        @for (tool of tools; track tool) {
          <li>{{ tool }}</li>
        }
      </ul>
    </section>
  `,
})
export default class AboutPage {
  protected readonly tools = [
    'Angular CLI 22 and TypeScript 6',
    'Tailwind CSS 4',
    'AG Grid Community for the user table',
    'Vitest 4 with jsdom for unit tests',
    'Playwright and axe-core for accessibility tests',
    'Prettier for formatting',
    'OpenSpec to specify each feature before building it',
    'Node 24, npm, and Git with Conventional Commits',
    'NVDA screen reader',
    'Claude Code to write the code through OpenSpec',
    'Angular CLI MCP server for project context',
    'Playwright MCP server for browser checks',
  ];
}
