import { Location } from '@angular/common';
import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { FieldTree, ValidationError, form, submit } from '@angular/forms/signals';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { toApiError } from '../core/api/api-error';
import { APP_NAME } from '../core/page-title-strategy';
import { User, UserDraft, Versioned } from '../core/api/user.model';
import { ConflictChoice, ConflictDialog } from './conflict-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { AVATAR_COLOR_CLASSES, avatarColorIndex, initialsOf } from './user-avatar';
import { toFieldErrors, userDraftSchema } from './user-draft-schema';
import { UserFormFields, focusFirstError } from './user-form-fields';
import { UsersService } from './users.service';

const EMPTY_DRAFT: UserDraft = { name: '', email: '', role: 'Member', status: 'invited' };

/**
 * A single user's view and edit screen. The loaded user and the ETag it was read with are held
 * together as one resource value, so a save always sends the ETag of the values it started from.
 */
@Component({
  selector: 'app-user-detail-page',
  imports: [ConflictDialog, ResetPasswordDialog, RouterLink, UserFormFields],
  template: `
    <a
      routerLink="/users"
      class="text-link underline underline-offset-2 hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >Back to users</a
    >
    <div class="mt-4 flex items-center gap-4">
      <!-- Hidden from assistive technology, since the heading beside it already names the user. -->
      @if (avatar(); as avatar) {
        <span
          aria-hidden="true"
          class="inline-flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
          [class]="avatar.classes"
          >{{ avatar.initials }}</span
        >
      }
      <!-- One heading element for every state, so the focus placed on it after navigation stays. -->
      <h1
        #headingElement
        tabindex="-1"
        class="min-w-0 text-2xl font-semibold break-words text-ink focus:outline-none"
      >
        {{ heading() }}
      </h1>
    </div>
    <!-- Only a loaded user gets the description, never "User not found" or a load failure. -->
    @if (user.hasValue()) {
      <p class="mt-2 text-ink-muted">Change this user's details, or send a password reset email.</p>
    }
    <p role="status" class="mt-2 min-h-6 text-sm text-ink-subtle">{{ status() }}</p>

    @if (notFound()) {
      <p class="mt-4 text-ink-muted">No user exists with the id {{ id() }}.</p>
    } @else if (loadFailed()) {
      <div
        role="alert"
        class="mt-2 flex flex-wrap items-center gap-3 rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
      >
        <span>The user could not be loaded.</span>
        <button
          type="button"
          (click)="retry()"
          class="min-h-11 rounded border border-danger-line-strong bg-surface px-4 font-medium text-danger-ink hover:bg-danger-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Try again
        </button>
      </div>
    } @else if (user.hasValue()) {
      <!-- Two columns from lg up. DOM order is form, Password, Demo, so Tab order never changes. -->
      <div class="mt-4 grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="details-heading"
          class="rounded-card border border-line-subtle bg-surface p-4 shadow-card sm:p-6 lg:col-span-2"
        >
          <h2 id="details-heading" class="font-semibold text-ink">Details</h2>
          <p class="text-sm text-ink-subtle tabular-nums">ID {{ user.value().data.id }}</p>
          <form
            novalidate
            (submit)="save($event)"
            (focusin)="revealFocus($event)"
            class="mt-4 grid gap-6"
          >
            <app-user-form-fields [fields]="fields" />
            @if (saveFailed()) {
              <div
                role="alert"
                class="rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
              >
                The user could not be saved. Try again.
              </div>
            }
            <!--
              The save bar. While the values differ from the loaded ones it sticks to the bottom
              of the viewport, inside the form's box, on viewports at least 30rem tall.
            -->
            <div
              [attr.data-save-bar-stuck]="unsaved() ? '' : null"
              class="flex flex-wrap items-center gap-3"
              [class]="unsaved() ? stuckBarClasses : ''"
            >
              <button
                #saveButton
                type="submit"
                aria-describedby="save-bar-status"
                class="inline-flex min-h-11 items-center gap-2 rounded bg-primary pr-4 pl-3 font-medium text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <svg
                  aria-hidden="true"
                  class="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Save
              </button>
              <!-- Leaving the screen discards the draft, the same as Cancel on the create screen. -->
              <a
                routerLink="/users"
                class="inline-flex min-h-11 items-center gap-2 rounded border border-line pr-4 pl-3 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <svg
                  aria-hidden="true"
                  class="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                Cancel
              </a>
              <!-- Always present, so the text is announced once when it appears. -->
              <p id="save-bar-status" role="status" class="text-sm text-ink-muted">
                {{ unsaved() ? 'Unsaved changes' : '' }}
              </p>
            </div>
          </form>
        </section>

        <div class="grid content-start gap-6">
          <section
            aria-labelledby="password-heading"
            class="rounded-card border border-line-subtle bg-surface p-4 shadow-card sm:p-6"
          >
            <h2 id="password-heading" class="font-semibold text-ink">Password</h2>
            <p class="mt-1 text-sm text-ink-muted">
              Send this user an email with a link to choose a new password.
            </p>
            <!-- Never disabled: a disabled button would drop focus and leave the Tab order. -->
            <button
              #resetButton
              type="button"
              (click)="openResetDialog()"
              class="mt-3 inline-flex min-h-11 items-center gap-2 rounded border border-line pr-4 pl-3 font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <svg
                aria-hidden="true"
                class="size-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="7.5" cy="15.5" r="4.5" />
                <path d="m10.7 12.3 9.8-9.8M17 6l3 3M14 9l2 2" />
              </svg>
              Reset password
            </button>
            @if (resetFailed()) {
              <div
                role="alert"
                class="mt-3 flex flex-wrap items-center gap-3 rounded border border-danger-line bg-danger-surface px-4 py-3 text-danger-ink"
              >
                <span>The password reset email could not be sent.</span>
                <button
                  type="button"
                  (click)="retryReset()"
                  class="min-h-11 rounded border border-danger-line-strong bg-surface px-4 font-medium text-danger-ink hover:bg-danger-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Try again
                </button>
              </div>
            }
          </section>

          <section
            aria-labelledby="demo-heading"
            class="rounded-card border border-dashed border-line-strong bg-surface p-4 shadow-card sm:p-6"
          >
            <h2 id="demo-heading" class="font-semibold text-ink">Demo</h2>
            <p class="mt-1 text-sm text-ink-muted">
              Changes this user's status the way another admin would, without updating this screen,
              so the next Save shows the edit conflict.
            </p>
            <button
              type="button"
              (click)="simulate()"
              class="mt-3 inline-flex min-h-11 items-center gap-2 rounded border border-line pr-4 pl-3 text-left font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <svg
                aria-hidden="true"
                class="size-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Simulate an edit by another admin
            </button>
          </section>
        </div>
      </div>
    }

    <app-conflict-dialog (choice)="resolveConflict($event)" />
    <app-reset-password-dialog
      [name]="loaded()?.data?.name ?? ''"
      [email]="loaded()?.data?.email ?? ''"
      (confirmed)="resolveReset($event)"
    />
  `,
})
export default class UserDetailPage {
  readonly id = input.required<string>();

  private readonly users = inject(UsersService);
  private readonly headingRef = viewChild.required<ElementRef<HTMLElement>>('headingElement');
  private readonly saveButton = viewChild<ElementRef<HTMLButtonElement>>('saveButton');
  private readonly conflictDialog = viewChild.required(ConflictDialog);
  private readonly resetButton = viewChild<ElementRef<HTMLButtonElement>>('resetButton');
  private readonly resetDialog = viewChild.required(ResetPasswordDialog);

  protected readonly user = resource({
    params: () => this.id(),
    loader: ({ params }) => this.users.loadUser(params),
  });
  protected readonly loaded = computed(() =>
    this.user.hasValue() ? this.user.value() : undefined,
  );
  private readonly loadError = computed(() => {
    const error = this.user.error();
    return error ? toApiError(error) : undefined;
  });

  /** The form's values. Every load, reload or save replaces them with the server's. */
  protected readonly draft = linkedSignal(() => toDraft(this.loaded()));
  protected readonly fields = form(this.draft, userDraftSchema);

  /**
   * Whether the form holds values other than the ones last loaded or saved. Values are compared,
   * so an edit typed back to the loaded value counts as saved, and a save or reload, which resets
   * the draft, clears it.
   */
  protected readonly unsaved = computed(() => {
    const loaded = this.loaded();
    return !!loaded && !sameDraft(this.draft(), toDraft(loaded));
  });
  /**
   * The save bar's look while there are unsaved edits: stuck to the viewport bottom on viewports at
   * least 30rem tall, stretched to the card's edges. Complete strings, so Tailwind finds them.
   */
  protected readonly stuckBarClasses =
    'tall:sticky tall:bottom-0 tall:z-10 -mx-4 border-t border-line-subtle bg-surface px-4 py-3 shadow-card sm:-mx-6 sm:px-6';

  protected readonly saveFailed = signal(false);
  protected readonly resetFailed = signal(false);
  private readonly resetting = signal(false);
  private readonly location = inject(Location);
  private readonly notice = signal(createdNotice(this.location.getState()));
  private readonly overwriting = signal(false);

  protected readonly notFound = computed(() => this.loadError()?.status === 404);
  protected readonly loadFailed = computed(() => !!this.loadError() && !this.notFound());
  protected readonly heading = computed(() => {
    if (this.notFound()) {
      return 'User not found';
    }
    return this.loaded()?.data.name ?? 'User';
  });
  /** The saved user's initials and color, matching the circle beside their name in the list. */
  protected readonly avatar = computed(() => {
    const user = this.notFound() ? undefined : this.loaded()?.data;
    return user
      ? { initials: initialsOf(user.name), classes: AVATAR_COLOR_CLASSES[avatarColorIndex(user.id)] }
      : undefined;
  });
  protected readonly status = computed(() => {
    if (this.user.isLoading()) {
      return 'Loading user…';
    }
    if (this.fields().submitting() || this.overwriting()) {
      return 'Saving…';
    }
    if (this.resetting()) {
      return 'Sending password reset email…';
    }
    // Every notice is about a loaded user, so none sits beside "User not found" or a load failure.
    return this.loaded() ? this.notice() : '';
  });

  constructor() {
    this.forgetCreatedNotice();
    const title = inject(Title);
    // The route title is only `User`; once the load settles, name the user (WCAG 2.4.2).
    effect(() => {
      if (this.loaded() || this.notFound()) {
        title.setTitle(`${this.heading()} | ${APP_NAME}`);
      }
    });
  }

  /**
   * Scroll padding keeps focused controls clear of the stuck save bar, and this backs it up for a
   * browser that does not apply the padding when focus moves (WCAG 2.4.11). `nearest` leaves a
   * control that is already in view where it is.
   */
  protected revealFocus(event: FocusEvent): void {
    if (event.target instanceof HTMLElement) {
      event.target.scrollIntoView?.({ block: 'nearest' });
    }
  }

  protected retry(): void {
    // Try again leaves the DOM with the alert, so hand focus to the heading instead of losing it.
    this.headingRef().nativeElement.focus();
    this.user.reload();
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const loaded = this.loaded();
    if (!loaded || this.busy()) {
      return;
    }
    await this.submitWith(loaded.etag);
  }

  protected async simulate(): Promise<void> {
    this.notice.set('');
    try {
      await this.users.simulateConcurrentEdit(this.id());
      this.notice.set('Another admin changed this user. Save to see the conflict.');
    } catch {
      this.notice.set('The simulated edit could not be made.');
    }
  }

  protected async resolveConflict(choice: ConflictChoice): Promise<void> {
    this.saveButton()?.nativeElement.focus();
    if (choice === 'reload') {
      this.notice.set('Reloaded the latest version of this user.');
      this.fields().reset();
      this.user.reload();
    } else if (choice === 'overwrite') {
      await this.overwrite();
    }
  }

  protected openResetDialog(): void {
    // A reset already on its way is not sent twice.
    if (!this.resetting()) {
      this.resetDialog().show();
    }
  }

  protected async resolveReset(confirmed: boolean): Promise<void> {
    this.resetButton()?.nativeElement.focus();
    if (confirmed) {
      await this.sendReset();
    }
  }

  protected async retryReset(): Promise<void> {
    // Try again leaves the DOM with the alert, so hand focus to Reset password instead of losing it.
    // The admin already confirmed this reset, so it goes out without the dialog.
    this.resetButton()?.nativeElement.focus();
    await this.sendReset();
  }

  /**
   * The router keeps navigation state in the history entry and replays it on a reload or on Back
   * and Forward, so the created notice is dropped from the entry once read. The router writes the
   * entry before this screen renders, so replacing it after the first render is not overwritten.
   */
  private forgetCreatedNotice(): void {
    const state = this.location.getState();
    if (!this.notice() || !isRecord(state)) {
      return;
    }
    afterNextRender(() => {
      const { notice: _notice, ...rest } = state;
      this.location.replaceState(this.location.path(), '', rest);
    });
  }

  private busy(): boolean {
    return this.user.isLoading() || this.fields().submitting() || this.overwriting();
  }

  /** Saves the admin's values over whatever the server holds now, using its current ETag. */
  private async overwrite(): Promise<void> {
    this.overwriting.set(true);
    try {
      const { etag } = await this.users.loadUser(this.id());
      this.overwriting.set(false);
      await this.submitWith(etag);
    } catch {
      this.overwriting.set(false);
      this.saveFailed.set(true);
    }
  }

  /** Sends the reset email. It never touches the form, its unsaved edits or the held ETag. */
  private async sendReset(): Promise<void> {
    if (this.resetting()) {
      return;
    }
    this.resetting.set(true);
    this.resetFailed.set(false);
    this.notice.set('');
    try {
      await this.users.resetPassword(this.id());
      this.notice.set('Password reset email sent.');
    } catch {
      // Any error, a 404 included, gets the same alert; the app has no delete to cause a 404.
      this.resetFailed.set(true);
    } finally {
      this.resetting.set(false);
    }
  }

  private async submitWith(etag: string): Promise<void> {
    const ok = await submit(this.fields, (fields) => this.send(fields, etag));
    if (!ok) {
      focusFirstError(this.fields);
    }
  }

  private async send(
    fields: FieldTree<UserDraft>,
    etag: string,
  ): Promise<ValidationError.WithOptionalFieldTree[]> {
    this.saveFailed.set(false);
    this.resetFailed.set(false);
    this.notice.set('');
    try {
      const saved = await this.users.saveUser(this.id(), fields().value(), etag);
      this.user.set(saved);
      this.notice.set('User saved.');
      return [];
    } catch (caught) {
      const error = toApiError(caught);
      if (error.status === 412) {
        this.conflictDialog().show();
        return [];
      }
      const fieldErrors = error.status === 400 ? toFieldErrors(fields, error) : [];
      if (!fieldErrors.length) {
        this.saveFailed.set(true);
      }
      return fieldErrors;
    }
  }
}

function toDraft(loaded: Versioned<User> | undefined): UserDraft {
  if (!loaded) {
    return EMPTY_DRAFT;
  }
  const { id: _id, ...draft } = loaded.data;
  return draft;
}

function sameDraft(a: UserDraft, b: UserDraft): boolean {
  return a.name === b.name && a.email === b.email && a.role === b.role && a.status === b.status;
}

function createdNotice(state: unknown): string {
  return isRecord(state) && state['notice'] === 'created' ? 'User created.' : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
