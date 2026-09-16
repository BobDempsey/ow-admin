import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { expectNoAxeViolations } from '../../testing/axe';
import { seedUser } from '../core/api/in-memory/user-seed';
import { User } from '../core/api/user.model';
import { RowActionsMenu, RowActionsMenuClose } from './row-actions-menu';

const radia: User = { ...seedUser(42), id: 'u-000042', name: 'Radia Lamport' };

function rect(top: number, left: number, width: number, height: number): DOMRect {
  return {
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

/** Sets the viewport size the menu reads, which jsdom reports as 0 by 0. */
function setViewport(width: number, height: number) {
  const root = document.documentElement;
  Object.defineProperty(root, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(root, 'clientHeight', { configurable: true, value: height });
}

async function renderMenu(
  buttonRect = rect(100, 600, 32, 32),
  viewport = { width: 1024, height: 768 },
  menuSize = { width: 160, height: 96 },
) {
  setViewport(viewport.width, viewport.height);
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'users/:id', children: [] }])],
  });
  const anchor = document.createElement('button');
  document.body.append(anchor);
  anchor.getBoundingClientRect = () => buttonRect;

  const fixture = TestBed.createComponent(RowActionsMenu);
  const host = fixture.nativeElement as HTMLElement;
  // The menu measures itself after its first render, which runs in whenStable below.
  host.getBoundingClientRect = () => rect(0, 0, menuSize.width, menuSize.height);
  fixture.componentRef.setInput('user', radia);
  fixture.componentRef.setInput('anchor', anchor);
  const closes: RowActionsMenuClose[] = [];
  const resets = vi.fn();
  fixture.componentInstance.closed.subscribe((close) => closes.push(close));
  fixture.componentInstance.resetPassword.subscribe(resets);
  await fixture.whenStable();

  const items = () => Array.from(host.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const press = async (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    (document.activeElement ?? host).dispatchEvent(event);
    await fixture.whenStable();
    return event;
  };
  return { fixture, host, anchor, items, press, closes, resets };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.querySelectorAll('body > button').forEach((node) => node.remove());
  const root = document.documentElement as unknown as Record<string, unknown>;
  delete root['clientWidth'];
  delete root['clientHeight'];
});

describe('RowActionsMenu', () => {
  it('is a menu named for the user, with View and Reset password, focused on View', async () => {
    const { host, items } = await renderMenu();
    const menu = host.querySelector('[role="menu"]');

    expect(menu?.getAttribute('aria-label')).toBe('Actions for Radia Lamport');
    expect(items().map((item) => item.textContent?.trim())).toEqual(['View', 'Reset password']);
    expect(items()[0].getAttribute('href')).toBe('/users/u-000042');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('moves with the arrow keys, wrapping at either end, and jumps with Home and End', async () => {
    const { items, press } = await renderMenu();

    await press('ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    await press('ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
    await press('ArrowUp');
    expect(document.activeElement).toBe(items()[1]);
    await press('Home');
    expect(document.activeElement).toBe(items()[0]);
    await press('End');
    expect(document.activeElement).toBe(items()[1]);
  });

  it('keeps one item in the Tab order, the focused one', async () => {
    const { fixture, items, press } = await renderMenu();

    await press('ArrowDown');
    await fixture.whenStable();

    expect(items().map((item) => item.getAttribute('tabindex'))).toEqual(['-1', '0']);
  });

  it.each(['Enter', ' '])('starts a reset with %j on Reset password', async (key) => {
    const { press, closes, resets } = await renderMenu();

    await press('End');
    const event = await press(key);

    expect(event.defaultPrevented).toBe(true);
    expect(closes).toEqual([{ returnFocus: false }]);
    expect(resets).toHaveBeenCalledOnce();
  });

  it('leaves Enter on View to the link', async () => {
    const { press, resets } = await renderMenu();

    const event = await press('Enter');

    expect(event.defaultPrevented).toBe(false);
    expect(resets).not.toHaveBeenCalled();
  });

  it('opens the user with Space on View, through the router', async () => {
    const { press, closes } = await renderMenu();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const event = await press(' ');

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/users', 'u-000042']);
    expect(closes).toEqual([{ returnFocus: false }]);
  });

  it.each(['Escape', 'Tab'])('closes on %s and asks for focus back on the cell', async (key) => {
    const { press, closes } = await renderMenu();

    const event = await press(key);

    expect(event.defaultPrevented).toBe(true);
    expect(closes).toEqual([{ returnFocus: true }]);
  });

  it('closes on a pointer press outside, but not on one inside or on its button', async () => {
    const { host, anchor, items, closes } = await renderMenu();

    items()[1].dispatchEvent(new Event('pointerdown', { bubbles: true }));
    anchor.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(closes).toEqual([]);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(closes).toEqual([{ returnFocus: false }]);
    expect(host.isConnected).toBe(true);
  });

  it('closes on scroll or resize, returning focus when it was in the menu', async () => {
    const { closes } = await renderMenu();

    document.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    expect(closes).toEqual([{ returnFocus: true }, { returnFocus: true }]);
  });

  it('opens below its button, right edges lined up', async () => {
    const { host } = await renderMenu(rect(100, 600, 32, 32));

    expect(host.style.top).toBe('136px');
    expect(host.style.left).toBe(`${632 - 160}px`);
  });

  it('flips above its button near the bottom of the viewport', async () => {
    const { host } = await renderMenu(rect(700, 600, 32, 32));

    expect(host.style.top).toBe(`${700 - 4 - 96}px`);
  });

  it('stays inside the viewport at the left edge', async () => {
    const { host } = await renderMenu(rect(100, 20, 32, 32), { width: 320, height: 568 });

    expect(host.style.left).toBe('8px');
  });

  it('has no axe violations', async () => {
    const { host } = await renderMenu();

    await expectNoAxeViolations(host);
  });
});
