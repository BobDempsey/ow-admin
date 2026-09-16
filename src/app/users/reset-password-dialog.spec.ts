import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

@Component({
  imports: [ResetPasswordDialog],
  template: `
    <app-reset-password-dialog
      name="Grace Hopper"
      email="grace@example.com"
      (confirmed)="answer($event)"
    />
  `,
})
class Host {
  readonly dialog = viewChild.required(ResetPasswordDialog);
  readonly answers: { confirmed: boolean; openWhenEmitted: boolean }[] = [];
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  answer(confirmed: boolean): void {
    const openWhenEmitted = this.element.nativeElement.querySelector('dialog')!.open;
    this.answers.push({ confirmed, openWhenEmitted });
  }
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

describe('ResetPasswordDialog', () => {
  it('stays closed until opened', async () => {
    const { dialog, showModal } = await render();

    expect(dialog.open).toBe(false);
    expect(showModal).not.toHaveBeenCalled();
  });

  it('opens as a modal that names the user and their email', async () => {
    const { dialog, openDialog, showModal } = await render();

    await openDialog();

    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    const description = document.getElementById(dialog.getAttribute('aria-describedby')!);
    expect(heading?.textContent?.trim()).toBe('Reset password?');
    expect(description?.textContent?.trim()).toBe(
      'Send Grace Hopper an email at grace@example.com with a link to choose a new password?',
    );
  });

  it('focuses Cancel, which comes first, when it opens', async () => {
    const { dialog, button, openDialog } = await render();

    await openDialog();

    expect(document.activeElement).toBe(button('Cancel'));
    expect(dialog.querySelector('button')).toBe(button('Cancel'));
  });

  it.each([
    ['Cancel', false],
    ['Send reset email', true],
  ] as const)('closes before emitting when %s is activated', async (name, confirmed) => {
    const { host, dialog, button, openDialog } = await render();
    await openDialog();

    button(name)?.click();

    expect(dialog.open).toBe(false);
    expect(host.answers).toEqual([{ confirmed, openWhenEmitted: false }]);
  });

  it('treats Escape as Cancel', async () => {
    const { host, dialog, openDialog } = await render();
    await openDialog();

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(host.answers).toEqual([{ confirmed: false, openWhenEmitted: false }]);
  });

  it('opens again after an answer', async () => {
    const { button, openDialog, showModal } = await render();
    await openDialog();
    button('Cancel')?.click();

    await openDialog();

    expect(showModal).toHaveBeenCalledTimes(2);
  });

  it('has no axe violations when open', async () => {
    const { element, openDialog } = await render();
    await openDialog();

    await expectNoAxeViolations(element);
  });
});
