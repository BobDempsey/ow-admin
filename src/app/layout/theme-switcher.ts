import { Component, inject } from '@angular/core';
import { ThemePreference, ThemeService } from '../core/theme.service';

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * The header's Light, Dark and System choice. Native radios give the group name, checked state
 * and arrow-key selection; the inputs are visually hidden and their labels drawn as a segmented
 * control, marked like the current nav entry (underline and bold, not only color).
 */
@Component({
  selector: 'app-theme-switcher',
  template: `
    <fieldset class="m-0 flex min-w-0 flex-wrap items-center gap-x-2 border-0 p-0">
      <legend class="float-left mr-1 text-sm text-header-muted">Theme</legend>
      <div class="flex flex-wrap items-center gap-1">
        @for (option of options; track option.value) {
          <label
            class="relative inline-flex min-h-11 cursor-pointer items-center border-b-[3px] border-transparent px-3 text-sm text-header-ink hover:bg-header-hover has-checked:border-header-accent has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-header-focus"
          >
            <input
              type="radio"
              name="theme"
              class="sr-only"
              [value]="option.value"
              [checked]="theme.preference() === option.value"
              (change)="theme.choose(option.value)"
            />
            {{ option.label }}
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class ThemeSwitcher {
  protected readonly theme = inject(ThemeService);
  protected readonly options = OPTIONS;
}
