import { Location } from '@angular/common';
import {
  Component,
  ElementRef,
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
  imports: [ConflictDialog, RouterLink, UserFormFields],
  template: `
    <a
      routerLink="/users"
      class="text-sky-700 underline underline-offset-2 hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
      >Back to users</a
    >
    <!-- One heading element for every state, so the focus placed on it after navigation stays. -->
    <h1
      #headingElement
      tabindex="-1"
      class="mt-4 text-2xl font-semibold break-words text-slate-900 focus:outline-none"
    >
      {{ heading() }}
    </h1>
    <p role="status" class="mt-2 min-h-6 text-sm text-slate-600">{{ status() }}</p>

    @if (notFound()) {
      <p class="mt-4 text-slate-700">No user exists with the id {{ id() }}.</p>
    } @else if (loadFailed()) {
      <div
        role="alert"
        class="mt-2 flex flex-wrap items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800"
      >
        <span>The user could not be loaded.</span>
        <button
          type="button"
          (click)="retry()"
          class="min-h-11 rounded border border-red-300 bg-white px-4 font-medium text-red-800 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Try again
        </button>
      </div>
    } @else if (user.hasValue()) {
      <p class="text-sm text-slate-600">ID {{ user.value().data.id }}</p>
      <form novalidate (submit)="save($event)" class="mt-4 grid gap-6">
        <app-user-form-fields [fields]="fields" />
        @if (saveFailed()) {
          <div role="alert" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            The user could not be saved. Try again.
          </div>
        }
        <div class="flex flex-wrap items-center gap-3">
          <button
            #saveButton
            type="submit"
            class="min-h-11 rounded bg-sky-700 px-4 font-medium text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            Save
          </button>
          <button
            type="button"
            (click)="cancel()"
            class="min-h-11 rounded border border-slate-300 px-4 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            Cancel
          </button>
        </div>
      </form>

      <section
        aria-labelledby="demo-heading"
        class="mt-10 max-w-md rounded border border-dashed border-slate-400 p-4"
      >
        <h2 id="demo-heading" class="font-semibold text-slate-900">Demo</h2>
        <p class="mt-1 text-sm text-slate-700">
          Changes this user's status the way another admin would, without updating this screen, so
          the next Save shows the edit conflict.
        </p>
        <button
          type="button"
          (click)="simulate()"
          class="mt-3 min-h-11 rounded border border-slate-300 px-4 font-medium text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          Simulate an edit by another admin
        </button>
      </section>
    }

    <app-conflict-dialog (choice)="resolveConflict($event)" />
  `,
})
export default class UserDetailPage {
  readonly id = input.required<string>();

  private readonly users = inject(UsersService);
  private readonly headingRef = viewChild.required<ElementRef<HTMLElement>>('headingElement');
  private readonly saveButton = viewChild<ElementRef<HTMLButtonElement>>('saveButton');
  private readonly conflictDialog = viewChild.required(ConflictDialog);

  protected readonly user = resource({
    params: () => this.id(),
    loader: ({ params }) => this.users.loadUser(params),
  });
  private readonly loaded = computed(() => (this.user.hasValue() ? this.user.value() : undefined));
  private readonly loadError = computed(() => {
    const error = this.user.error();
    return error ? toApiError(error) : undefined;
  });

  /** The form's values. Every load, reload or save replaces them with the server's. */
  protected readonly draft = linkedSignal(() => toDraft(this.loaded()));
  protected readonly fields = form(this.draft, userDraftSchema);

  protected readonly saveFailed = signal(false);
  private readonly notice = signal(createdNotice(inject(Location).getState()));
  private readonly overwriting = signal(false);

  protected readonly notFound = computed(() => this.loadError()?.status === 404);
  protected readonly loadFailed = computed(() => !!this.loadError() && !this.notFound());
  protected readonly heading = computed(() => {
    if (this.notFound()) {
      return 'User not found';
    }
    return this.loaded()?.data.name ?? 'User';
  });
  protected readonly status = computed(() => {
    if (this.user.isLoading()) {
      return 'Loading user…';
    }
    if (this.fields().submitting() || this.overwriting()) {
      return 'Saving…';
    }
    return this.notice();
  });

  constructor() {
    const title = inject(Title);
    // The route title is only `User`; once the load settles, name the user (WCAG 2.4.2).
    effect(() => {
      if (this.loaded() || this.notFound()) {
        title.setTitle(`${this.heading()} | ${APP_NAME}`);
      }
    });
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

  protected cancel(): void {
    this.saveFailed.set(false);
    this.notice.set('');
    this.fields().reset(toDraft(this.loaded()));
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

function createdNotice(state: unknown): string {
  const created =
    typeof state === 'object' && state !== null && 'notice' in state && state.notice === 'created';
  return created ? 'User created.' : '';
}
