import { Component, ElementRef, viewChild } from '@angular/core';

/** The live example the demo drawer links to. */
export const AI_STOREFRONT_URL = 'https://ai-storefront.bobdempsey83.com/';

interface ChatMessage {
  from: 'assistant' | 'admin';
  text: string;
}

/** A fixed conversation that shows what an assistant in this app could look like. */
const DEMO_MESSAGES: readonly ChatMessage[] = [
  { from: 'assistant', text: 'Hi! I can help you find users, change roles or send password resets.' },
  { from: 'admin', text: 'Which admins were invited but never signed in?' },
  {
    from: 'assistant',
    text: 'In a real build I would filter the list for you. This one is a demo, so try the live example below.',
  },
];

/**
 * The header's AI assistant button and the drawer it opens. The drawer is a mock: its conversation
 * is fixed, its message field is disabled, and it links to a live example on another site. Like
 * `NavDrawer` it is a native modal `<dialog>`; Escape, Close and a backdrop click return focus to
 * the button.
 */
@Component({
  selector: 'app-ai-chat-drawer',
  host: { class: 'contents' },
  template: `
    <button
      #opener
      type="button"
      aria-haspopup="dialog"
      title="AI assistant"
      (click)="show()"
      class="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-header-muted hover:bg-header-hover hover:text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus motion-safe:transition-colors"
    >
      <svg
        aria-hidden="true"
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="4" y="8" width="16" height="12" rx="3" />
        <path d="M12 8V4M2 13v3M22 13v3M9 13v1M15 13v1M10 17h4" />
        <circle cx="12" cy="3" r="1" />
      </svg>
      <span class="sr-only">AI assistant</span>
    </button>
    <dialog
      #dialog
      aria-labelledby="ai-chat-heading"
      (cancel)="onCancel($event)"
      (click)="onClick($event)"
      class="fixed top-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(24rem,90vw)] max-w-none bg-surface p-0 text-ink shadow-xl backdrop:bg-backdrop/60"
    >
      <!-- Everything sits in this wrapper, so only a backdrop click has the dialog as its target. -->
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between gap-3 border-b border-line-subtle p-4">
          <div class="flex items-center gap-2">
            <h2
              #heading
              id="ai-chat-heading"
              tabindex="-1"
              class="text-lg font-semibold focus:outline-none"
            >
              AI assistant
            </h2>
            <span
              class="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-ink-muted"
              >Demo</span
            >
          </div>
          <button
            type="button"
            title="Close"
            (click)="close()"
            class="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus motion-safe:transition-colors"
          >
            <svg
              aria-hidden="true"
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
            <span class="sr-only">Close</span>
          </button>
        </div>

        <ol aria-label="Sample conversation" class="flex grow flex-col gap-3 overflow-y-auto p-4">
          @for (message of messages; track $index) {
            <li
              class="max-w-[85%] rounded-2xl px-4 py-2 text-sm"
              [class]="
                message.from === 'admin'
                  ? 'self-end rounded-br-sm bg-primary text-on-primary'
                  : 'self-start rounded-bl-sm bg-surface-muted text-ink'
              "
            >
              <span class="sr-only">{{ message.from === 'admin' ? 'You:' : 'Assistant:' }} </span
              >{{ message.text }}
            </li>
          }
        </ol>

        <div class="border-t border-line-subtle p-4">
          <p class="text-sm text-ink-muted">
            Visit AI Storefront to see how an AI assistant could be added to your app.
          </p>
          <a
            [href]="storefrontUrl"
            target="_blank"
            rel="noopener"
            class="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            View the live example
            <svg
              aria-hidden="true"
              class="size-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
            <span class="sr-only">(opens in a new tab)</span>
          </a>
          <label for="ai-chat-message" class="sr-only">Message</label>
          <input
            id="ai-chat-message"
            type="text"
            disabled
            placeholder="Messaging is off in this demo"
            class="mt-3 min-h-11 w-full cursor-not-allowed rounded border border-line bg-surface-muted px-3 text-sm text-ink-subtle placeholder:text-ink-subtle"
          />
        </div>
      </div>
    </dialog>
  `,
})
export class AiChatDrawer {
  protected readonly messages = DEMO_MESSAGES;
  protected readonly storefrontUrl = AI_STOREFRONT_URL;

  private readonly opener = viewChild.required<ElementRef<HTMLButtonElement>>('opener');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  show(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
    this.heading().nativeElement.focus();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.opener().nativeElement.focus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  /** A click on the backdrop reaches the dialog element itself; a click inside never does. */
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
