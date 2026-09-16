import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import AboutPage from './about-page';

async function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(AboutPage);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

const text = (element: Element | null) => element?.textContent?.replace(/\s+/g, ' ').trim();

describe('AboutPage', () => {
  it('has one focusable level 1 heading', async () => {
    const element = await render();
    const headings = element.querySelectorAll('h1');

    expect(headings).toHaveLength(1);
    expect(text(headings[0])).toBe('About this app');
    expect(headings[0].getAttribute('tabindex')).toBe('-1');
  });

  it('follows the heading with a lead paragraph in the screen description style', async () => {
    const element = await render();
    const lead = element.querySelector('h1 + p');

    expect(text(lead)).toBe('An admin screen for managing users, built as a take-home exercise.');
    expect(lead?.classList).toContain('text-ink-muted');
    expect(lead?.classList).not.toContain('text-lg');
  });

  it('has a section for each topic', async () => {
    const element = await render();

    expect(Array.from(element.querySelectorAll('h2')).map(text)).toEqual([
      'What it does',
      'How the data works',
      'Try an edit conflict',
      'Accessibility',
      'Development',
    ]);
  });

  it('links to the user list and the create screen', async () => {
    const element = await render();
    const links = Array.from(element.querySelectorAll('a')).map((link) => [
      text(link),
      link.getAttribute('href'),
    ]);

    expect(links).toEqual([
      ['Go to users', '/users'],
      ['Create a user', '/users/new'],
    ]);
  });

  it('explains the data and the conflict steps', async () => {
    const element = await render();
    const data = text(element.querySelector('[aria-labelledby="about-data"]'));
    const steps = Array.from(element.querySelectorAll('[aria-labelledby="about-conflict"] li'));

    expect(data).toContain('in-memory store of 500,000 users');
    expect(data).toContain('resets on reload');
    expect(data).toContain('ETag');
    expect(steps.map(text)).toContain('Select "Simulate an edit by another admin".');
    expect(text(steps.at(-1)!)).toBe('Choose Keep editing, Reload or Overwrite.');
  });

  it('lists the tooling, including OpenSpec and the AI tools', async () => {
    const element = await render();
    const tools = text(element.querySelector('[aria-labelledby="about-development"]'));

    for (const name of ['Angular CLI', 'Tailwind CSS', 'Vitest', 'Playwright', 'Prettier']) {
      expect(tools).toContain(name);
    }
    expect(tools).toContain('OpenSpec');
    expect(tools).toContain('Claude Code');
    expect(tools).toContain('MCP server');
  });

  it('keeps each prose section to two sentences or fewer', async () => {
    const element = await render();

    for (const paragraph of Array.from(element.querySelectorAll('section p'))) {
      const sentences = text(paragraph)!.match(/[.!?](\s|$)/g) ?? [];
      expect(sentences.length).toBeLessThanOrEqual(2);
    }
  });

  it('has no axe violations', async () => {
    const element = await render();

    await expectNoAxeViolations(element);
  });
});
