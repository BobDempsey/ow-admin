import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ThemePreference, ThemeService } from '../core/theme.service';

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * The picture for a theme choice: a sun for Light, a moon for Dark and a monitor for System. It is
 * decorative, so the label beside it (or the button's hidden text) carries the name. The host sets
 * the size and color; the strokes follow `currentColor`.
 */
@Component({
  selector: 'app-theme-icon',
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-full"
    >
      @switch (preference()) {
        @case ('light') {
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
          />
        }
        @case ('dark') {
          <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472A7 7 0 0 0 20.985 12.486z" />
        }
        @default {
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        }
      }
    </svg>
  `,
})
export class ThemeIcon {
  readonly preference = input.required<ThemePreference>();
}

/**
 * The header's Light, Dark and System choice, built as a menu button following the WAI-ARIA menu
 * button pattern: a "Theme" button opens a `menu` of `menuitemradio` items, the chosen one marked
 * with a check mark. The button shows the chosen item's icon, and its hidden text and `title` name
 * it with the current choice, such as "Theme: Dark", so the choice is known before the menu opens.
 * The menu itself stays named "Theme". A closed menu is not rendered, so it is out of the
 * accessibility tree. Focus
 * moves through the items with a roving `tabindex`, and choosing applies the theme, closes the
 * menu and returns focus to the button.
 */
@Component({
  selector: 'app-theme-switcher',
  host: {
    class: 'relative block',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  imports: [ThemeIcon],
  template: `
    <button
      #button
      type="button"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? menuId : null"
      (click)="toggle()"
      (keydown)="onButtonKeydown($event)"
      [title]="buttonName()"
      class="inline-flex size-11 items-center justify-center rounded-lg text-header-muted hover:bg-header-hover hover:text-header-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-header-focus aria-expanded:bg-header-hover aria-expanded:text-header-ink motion-safe:transition-colors"
    >
      <app-theme-icon [preference]="theme.preference()" class="size-5" />
      <span class="sr-only">{{ buttonName() }}</span>
    </button>
    @if (open()) {
      <div
        [id]="menuId"
        role="menu"
        aria-label="Theme"
        class="absolute top-full right-0 z-20 mt-2 min-w-44 rounded-xl border border-line bg-surface p-1 text-ink shadow-lg"
      >
        @for (option of options; track option.value; let index = $index) {
          <button
            #item
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="theme.preference() === option.value"
            [tabindex]="index === focusedIndex() ? 0 : -1"
            (click)="select(option.value)"
            (keydown)="onMenuKeydown($event, option.value)"
            class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-checked:bg-surface-muted aria-checked:font-semibold motion-safe:transition-colors"
          >
            <app-theme-icon [preference]="option.value" class="size-4 text-ink-muted" />
            <span class="grow">{{ option.label }}</span>
            <!-- The mark keeps its space when unchecked so the rows keep one width. -->
            <span class="inline-flex size-4 shrink-0 items-center justify-center text-link">
              @if (theme.preference() === option.value) {
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                >
                  <path d="M3.5 8.5 6.5 11.5 12.5 5" />
                </svg>
              }
            </span>
          </button>
        }
      </div>
    }
  `,
})
export class ThemeSwitcher {
  private readonly injector = inject(Injector);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  private readonly items = viewChildren<ElementRef<HTMLButtonElement>>('item');

  protected readonly theme = inject(ThemeService);
  protected readonly options = OPTIONS;
  protected readonly menuId = 'theme-menu';
  protected readonly open = signal(false);
  protected readonly focusedIndex = signal(0);
  protected readonly buttonName = computed(() => {
    const preference = this.theme.preference();
    const label = OPTIONS.find((option) => option.value === preference)?.label ?? preference;
    return `Theme: ${label}`;
  });

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  protected select(preference: ThemePreference): void {
    this.theme.choose(preference);
    this.close();
  }

  protected onButtonKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') {
      return;
    }
    // Handling Enter and Space here rather than letting them click the button keeps one path into
    // the menu, and stops Space scrolling the page.
    event.preventDefault();
    this.openMenu();
  }

  protected onMenuKeydown(event: KeyboardEvent, preference: ThemePreference): void {
    switch (event.key) {
      case 'ArrowDown':
        this.moveFocus(this.focusedIndex() + 1);
        break;
      case 'ArrowUp':
        this.moveFocus(this.focusedIndex() - 1);
        break;
      case 'Home':
        this.moveFocus(0);
        break;
      case 'End':
        this.moveFocus(OPTIONS.length - 1);
        break;
      case 'Enter':
      case ' ':
        this.select(preference);
        break;
      case 'Escape':
        this.close();
        break;
      case 'Tab':
        // Only the focused item is tabbable, so leaving focus where it is lets Tab move on to the
        // next control after the menu, or back to the button. Refocusing the button here would
        // send Tab straight back into the menu, since the menu follows it in the DOM.
        this.close(false);
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onDocumentPointerDown(event: Event): void {
    if (this.open() && !this.hostElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (this.open() && !this.hostElement.contains(event.relatedTarget as Node | null)) {
      this.close(false);
    }
  }

  private openMenu(): void {
    const checked = OPTIONS.findIndex((option) => option.value === this.theme.preference());
    this.focusedIndex.set(Math.max(checked, 0));
    this.open.set(true);
    afterNextRender(() => this.focusItem(), { injector: this.injector });
  }

  private close(returnFocus = true): void {
    this.open.set(false);
    if (returnFocus) {
      this.button().nativeElement.focus();
    }
  }

  private moveFocus(index: number): void {
    const count = OPTIONS.length;
    this.focusedIndex.set(((index % count) + count) % count);
    this.focusItem();
  }

  private focusItem(): void {
    this.items()[this.focusedIndex()]?.nativeElement.focus();
  }
}
