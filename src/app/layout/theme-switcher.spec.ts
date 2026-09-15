import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { THEME_STORAGE_KEY, ThemeService } from '../core/theme.service';
import { ThemeSwitcher } from './theme-switcher';

async function renderSwitcher() {
  const fixture = TestBed.createComponent(ThemeSwitcher);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const radio = (label: string) =>
    Array.from(element.querySelectorAll<HTMLInputElement>('input[type="radio"]')).find(
      (input) => input.closest('label')?.textContent?.trim() === label,
    )!;
  return { fixture, element, radio, service: TestBed.inject(ThemeService) };
}

describe('ThemeSwitcher', () => {
  beforeEach(() => localStorage.clear());

  it('groups three radios under the name Theme', async () => {
    const { element } = await renderSwitcher();
    const group = element.querySelector('fieldset');
    const labels = Array.from(group?.querySelectorAll('label') ?? []).map((label) =>
      label.textContent?.trim(),
    );

    expect(group?.querySelector('legend')?.textContent?.trim()).toBe('Theme');
    expect(labels).toEqual(['Light', 'Dark', 'System']);
    expect(group?.querySelectorAll('input[type="radio"][name="theme"]').length).toBe(3);
  });

  it('checks System on a first visit', async () => {
    const { radio } = await renderSwitcher();

    expect(radio('System').checked).toBe(true);
    expect(radio('Light').checked).toBe(false);
    expect(radio('Dark').checked).toBe(false);
  });

  it('checks the radio for the current choice', async () => {
    const { fixture, radio, service } = await renderSwitcher();

    service.choose('dark');
    await fixture.whenStable();

    expect(radio('Dark').checked).toBe(true);
    expect(radio('System').checked).toBe(false);
  });

  it('applies and remembers the radio the admin selects', async () => {
    const { fixture, radio, service } = await renderSwitcher();

    radio('Light').click();
    await fixture.whenStable();

    expect(service.preference()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('has no axe violations', async () => {
    const { element } = await renderSwitcher();

    await expectNoAxeViolations(element);
  });
});
