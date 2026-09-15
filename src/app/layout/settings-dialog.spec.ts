import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { TableSettingsService } from '../core/table-settings.service';
import { ThemeService } from '../core/theme.service';
import { SettingsDialog } from './settings-dialog';

async function openDialog() {
  const dialogMethods = stubDialogMethods();
  const opener = document.createElement('button');
  opener.textContent = 'Settings';
  document.body.append(opener);
  const fixture = TestBed.createComponent(SettingsDialog);
  await fixture.whenStable();
  fixture.componentInstance.show(opener);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const control = (label: string) =>
    Array.from(element.querySelectorAll<HTMLInputElement>('input')).find(
      (input) => input.closest('label')?.textContent?.trim() === label,
    )!;
  const note = () => element.querySelector('#settings-movable-columns-wcag');
  return {
    fixture,
    element,
    opener,
    control,
    note,
    dialogMethods,
    dialog: element.querySelector('dialog')!,
    theme: TestBed.inject(ThemeService),
    table: TestBed.inject(TableSettingsService),
  };
}

describe('SettingsDialog', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => document.body.querySelectorAll('button').forEach((button) => button.remove()));

  it('opens as a modal named Settings with focus on its heading', async () => {
    const { dialog, dialogMethods } = await openDialog();
    const heading = dialog.querySelector('h2')!;

    expect(dialogMethods.showModal).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)).toBe(heading);
    expect(heading.textContent?.trim()).toBe('Settings');
    expect(document.activeElement).toBe(heading);
  });

  it('closes with Close and returns focus to the opener', async () => {
    const { element, dialog, opener } = await openDialog();
    const close = Array.from(element.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Close',
    )!;

    close.click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const { dialog, opener } = await openDialog();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('shows the current theme and applies a new one', async () => {
    const { fixture, control, theme } = await openDialog();
    expect(control('System').checked).toBe(true);

    control('Dark').click();
    await fixture.whenStable();
    expect(theme.preference()).toBe('dark');

    theme.choose('light');
    await fixture.whenStable();
    expect(control('Light').checked).toBe(true);
    expect(control('Light').name).toBe('settings-theme');
  });

  it('groups the theme and density choices under named fieldsets', async () => {
    const { element } = await openDialog();
    const legends = Array.from(element.querySelectorAll('fieldset legend')).map((legend) =>
      legend.textContent?.trim(),
    );

    expect(legends).toEqual(['Theme', 'Density']);
  });

  it('applies striped rows, density and draggable columns', async () => {
    const { fixture, control, table } = await openDialog();
    expect(control('Striped rows').checked).toBe(false);
    expect(control('Comfortable').checked).toBe(true);
    expect(control('Draggable columns').checked).toBe(false);

    control('Striped rows').click();
    control('Compact').click();
    control('Draggable columns').click();
    await fixture.whenStable();

    expect(table.striped()).toBe(true);
    expect(table.density()).toBe('compact');
    expect(table.movableColumns()).toBe(true);
  });

  it('shows a WCAG 2.5.7 note described by the checkbox only while draggable columns is on', async () => {
    const { fixture, control, note } = await openDialog();
    const checkbox = control('Draggable columns');
    expect(note()).toBeNull();
    expect(checkbox.getAttribute('aria-describedby')).toBe('settings-movable-columns-hint');
    expect(document.getElementById('settings-movable-columns-hint')?.textContent).toContain(
      'Drag a column header to reorder the columns.',
    );

    checkbox.click();
    await fixture.whenStable();

    expect(note()?.textContent).toContain('Fails WCAG 2.5.7 Dragging Movements.');
    expect(note()?.textContent).toContain('only by dragging');
    expect(checkbox.getAttribute('aria-describedby')).toBe(
      `settings-movable-columns-hint ${note()?.id}`,
    );

    checkbox.click();
    await fixture.whenStable();

    expect(note()).toBeNull();
    expect(checkbox.getAttribute('aria-describedby')).toBe('settings-movable-columns-hint');
  });

  it('shows no WCAG note for any conforming combination', async () => {
    const { fixture, control, element } = await openDialog();

    for (const label of ['Light', 'Dark', 'System']) {
      control(label).click();
      for (const density of ['Comfortable', 'Compact']) {
        control(density).click();
        for (let flip = 0; flip < 2; flip++) {
          control('Striped rows').click();
          await fixture.whenStable();
          expect(element.textContent).not.toContain('Fails WCAG');
        }
      }
    }
  });

  it('has no axe violations, with and without the WCAG note', async () => {
    const { fixture, element, control } = await openDialog();
    await expectNoAxeViolations(element);

    control('Draggable columns').click();
    await fixture.whenStable();

    await expectNoAxeViolations(element);
  });
});
