import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { ConflictChoice, ConflictDialog } from './conflict-dialog';

@Component({
  imports: [ConflictDialog],
  template: `<app-conflict-dialog (choice)="choices.push($event)" />`,
})
class Host {
  readonly dialog = viewChild.required(ConflictDialog);
  readonly choices: ConflictChoice[] = [];
}

async function render() {
  const stubs = stubDialogMethods();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const dialog = element.querySelector('dialog')!;
  const button = (name: string) =>
    Array.from(dialog.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === name,
    );
  const openDialog = async () => {
    fixture.componentInstance.dialog().show();
    await fixture.whenStable();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    element,
    dialog,
    button,
    openDialog,
    ...stubs,
  };
}

describe('ConflictDialog', () => {
  it('stays closed until opened', async () => {
    const { dialog, showModal } = await render();

    expect(dialog.open).toBe(false);
    expect(showModal).not.toHaveBeenCalled();
  });

  it('opens as a modal named by its heading and described by its text', async () => {
    const { dialog, openDialog, showModal } = await render();

    await openDialog();

    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    const description = document.getElementById(dialog.getAttribute('aria-describedby')!);
    expect(heading?.textContent?.trim()).toBe('This user changed');
    expect(description?.textContent).toContain('Another admin saved changes to this user');
  });

  it('focuses Keep editing when it opens', async () => {
    const { button, openDialog } = await render();

    await openDialog();

    expect(document.activeElement).toBe(button('Keep editing'));
  });

  it.each([
    ['Keep editing', 'keep'],
    ['Reload', 'reload'],
    ['Overwrite', 'overwrite'],
  ] as const)('closes and emits %s', async (name, choice) => {
    const { host, dialog, button, openDialog } = await render();
    await openDialog();

    button(name)?.click();

    expect(dialog.open).toBe(false);
    expect(host.choices).toEqual([choice]);
  });

  it('treats Escape as Keep editing', async () => {
    const { host, dialog, openDialog } = await render();
    await openDialog();

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(host.choices).toEqual(['keep']);
  });

  it('opens again after a choice', async () => {
    const { button, openDialog, showModal } = await render();
    await openDialog();
    button('Overwrite')?.click();

    await openDialog();

    expect(showModal).toHaveBeenCalledTimes(2);
  });

  it('has no axe violations when open', async () => {
    const { element, openDialog } = await render();
    await openDialog();

    await expectNoAxeViolations(element);
  });
});
