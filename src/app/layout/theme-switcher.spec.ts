import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { THEME_STORAGE_KEY, ThemeService } from '../core/theme.service';
import { ThemeSwitcher } from './theme-switcher';

async function renderSwitcher() {
  const fixture = TestBed.createComponent(ThemeSwitcher);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const button = element.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
  const menu = () => element.querySelector<HTMLElement>('[role="menu"]');
  const items = () =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
  const item = (label: string) => items().find((entry) => entry.textContent?.trim() === label)!;
  const press = async (target: HTMLElement, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await fixture.whenStable();
    return event;
  };
  const openMenu = async () => {
    await press(button, 'Enter');
  };
  return {
    fixture,
    element,
    button,
    menu,
    items,
    item,
    press,
    openMenu,
    service: TestBed.inject(ThemeService),
  };
}

/** The label of the item that has focus, so the keyboard cases read as the pattern describes. */
const focusedLabel = () => document.activeElement?.textContent?.trim();

describe('ThemeSwitcher', () => {
  beforeEach(() => localStorage.clear());

  it('shows a Theme button that reports its menu as closed', async () => {
    const { button, menu } = await renderSwitcher();

    expect(button.textContent?.trim()).toBe('Theme');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  it('opens a menu named Theme with three checkable items', async () => {
    const { button, menu, items, openMenu } = await renderSwitcher();

    await openMenu();

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(menu()?.id);
    expect(menu()?.getAttribute('aria-label')).toBe('Theme');
    expect(items().map((entry) => entry.textContent?.trim())).toEqual(['Light', 'Dark', 'System']);
    expect(items().map((entry) => entry.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
    ]);
  });

  it('checks the item for the current choice and marks it with a check mark', async () => {
    const { fixture, item, items, openMenu, service } = await renderSwitcher();

    service.choose('dark');
    await fixture.whenStable();
    await openMenu();

    expect(item('Dark').getAttribute('aria-checked')).toBe('true');
    expect(item('System').getAttribute('aria-checked')).toBe('false');
    expect(items().filter((entry) => entry.querySelector('svg')).length).toBe(1);
    expect(item('Dark').querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies and remembers the item the admin clicks, then closes', async () => {
    const { fixture, button, item, menu, openMenu, service } = await renderSwitcher();

    await openMenu();
    item('Light').click();
    await fixture.whenStable();

    expect(service.preference()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('has no axe violations with the menu open', async () => {
    const { element, openMenu } = await renderSwitcher();

    await openMenu();

    await expectNoAxeViolations(element);
  });

  describe('keyboard', () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      it(`opens on the checked item when the button gets ${key === ' ' ? 'Space' : key}`, async () => {
        const { button, menu, press } = await renderSwitcher();

        const event = await press(button, key);

        expect(menu()).not.toBeNull();
        expect(focusedLabel()).toBe('System');
        expect(event.defaultPrevented).toBe(true);
      });
    }

    it('wraps with Down Arrow and Up Arrow', async () => {
      const { item, press, openMenu } = await renderSwitcher();
      await openMenu();

      await press(item('System'), 'ArrowDown');
      expect(focusedLabel()).toBe('Light');

      await press(item('Light'), 'ArrowUp');
      expect(focusedLabel()).toBe('System');
    });

    it('moves to the first and last item with Home and End', async () => {
      const { item, press, openMenu } = await renderSwitcher();
      await openMenu();

      await press(item('System'), 'Home');
      expect(focusedLabel()).toBe('Light');

      await press(item('Light'), 'End');
      expect(focusedLabel()).toBe('System');
    });

    it('moves focus without changing the choice', async () => {
      const { item, press, openMenu, service } = await renderSwitcher();
      await openMenu();

      await press(item('System'), 'Home');
      await press(item('Light'), 'ArrowDown');

      expect(focusedLabel()).toBe('Dark');
      expect(service.preference()).toBe('system');
    });

    for (const key of ['Enter', ' ']) {
      it(`selects, closes and refocuses the button on ${key === ' ' ? 'Space' : key}`, async () => {
        const { button, item, menu, press, openMenu, service } = await renderSwitcher();
        await openMenu();

        await press(item('System'), 'Home');
        await press(item('Light'), 'ArrowDown');
        await press(item('Dark'), key);

        expect(service.preference()).toBe('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(button);
      });
    }

    it('closes on Escape without changing the choice', async () => {
      const { button, item, menu, press, openMenu, service } = await renderSwitcher();
      await openMenu();

      await press(item('System'), 'Home');
      await press(item('Light'), 'Escape');

      expect(menu()).toBeNull();
      expect(service.preference()).toBe('system');
      expect(document.activeElement).toBe(button);
    });

    it('closes on Tab and lets focus move on', async () => {
      const { item, menu, press, openMenu, service } = await renderSwitcher();
      await openMenu();

      const event = await press(item('System'), 'Tab');

      expect(menu()).toBeNull();
      expect(service.preference()).toBe('system');
      // Focus is left where it is, so the browser's own Tab carries it out of the closing menu.
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('closing by pointer and focus', () => {
    it('closes on a pointer press outside without changing the choice', async () => {
      const { fixture, menu, openMenu, service } = await renderSwitcher();
      await openMenu();

      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      await fixture.whenStable();

      expect(menu()).toBeNull();
      expect(service.preference()).toBe('system');
    });

    it('stays open while focus moves inside it', async () => {
      const { fixture, button, item, menu, openMenu } = await renderSwitcher();
      await openMenu();

      button.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: item('System') }),
      );
      await fixture.whenStable();

      expect(menu()).not.toBeNull();
    });

    it('closes when focus leaves it', async () => {
      const { fixture, item, menu, openMenu } = await renderSwitcher();
      await openMenu();

      item('System').dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
      );
      await fixture.whenStable();

      expect(menu()).toBeNull();
    });
  });
});
