import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { stubDialogMethods } from '../../testing/dialog';
import { AI_STOREFRONT_URL, AiChatDrawer } from './ai-chat-drawer';

async function renderDrawer() {
  const dialogMethods = stubDialogMethods();
  const fixture = TestBed.createComponent(AiChatDrawer);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const opener = element.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
  const dialog = element.querySelector('dialog')!;
  const closeButton = Array.from(dialog.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === 'Close',
  )!;
  const open = async () => {
    opener.click();
    await fixture.whenStable();
  };
  return { fixture, element, opener, dialog, closeButton, open, ...dialogMethods };
}

describe('AiChatDrawer', () => {
  it('shows an AI assistant button that opens a dialog', async () => {
    const { opener, dialog } = await renderDrawer();

    expect(opener.textContent?.trim()).toBe('AI assistant');
    expect(opener.title).toBe('AI assistant');
    expect(opener.getAttribute('type')).toBe('button');
    expect(opener.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('opens as a modal and moves focus to the heading', async () => {
    const { dialog, open, showModal } = await renderDrawer();

    await open();

    const heading = dialog.querySelector('h2')!;
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent?.trim()).toBe('AI assistant');
    expect(document.activeElement).toBe(heading);
  });

  it('closes from the Close button and returns focus to the AI assistant button', async () => {
    const { opener, dialog, closeButton, open, close } = await renderDrawer();
    await open();

    closeButton.click();

    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape and returns focus to the AI assistant button', async () => {
    const { opener, dialog, open } = await renderDrawer();
    await open();

    // The browser turns Escape on a modal dialog into a cancelable cancel event.
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('links to the live example in a new tab and says so', async () => {
    const { dialog } = await renderDrawer();
    const link = dialog.querySelector<HTMLAnchorElement>('a')!;

    expect(link.getAttribute('href')).toBe(AI_STOREFRONT_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.textContent).toContain('(opens in a new tab)');
    expect(link.querySelector('.sr-only')?.textContent?.trim()).toBe('(opens in a new tab)');
  });

  it('shows a labelled message field that is disabled', async () => {
    const { dialog } = await renderDrawer();
    const field = dialog.querySelector<HTMLInputElement>('input')!;

    expect(field.disabled).toBe(true);
    expect(dialog.querySelector(`label[for="${field.id}"]`)?.textContent?.trim()).toBe('Message');
  });

  it('has no axe violations with the drawer open', async () => {
    const { element, open } = await renderDrawer();

    await open();

    await expectNoAxeViolations(element);
  });
});
