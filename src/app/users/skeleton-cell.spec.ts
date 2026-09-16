import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Column, ICellRendererParams } from 'ag-grid-community';
import { SkeletonCell } from './skeleton-cell';
import { UsersGridContext } from './users-grid-context';

async function renderCell(colId: string, loading = signal(true)) {
  const fixture = TestBed.createComponent(SkeletonCell);
  fixture.componentInstance.agInit({
    column: { getColId: () => colId } as Column,
    context: { loading },
  } as unknown as ICellRendererParams<unknown, unknown, UsersGridContext>);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const bars = () => Array.from(element.querySelectorAll('span span'));
  return { fixture, element, bars, loading };
}

describe('SkeletonCell', () => {
  it('draws a circle and a bar for the name column', async () => {
    const { bars } = await renderCell('name');

    expect(bars()).toHaveLength(2);
    expect(bars()[0].classList).toContain('rounded-full');
    expect(bars()[0].classList).toContain('size-8');
  });

  it('draws one wide bar for the email column', async () => {
    const { bars } = await renderCell('email');

    expect(bars()).toHaveLength(1);
    expect(bars()[0].classList).toContain('w-4/5');
  });

  it.each(['role', 'status'])('draws a short rounded bar for the %s column', async (colId) => {
    const { bars } = await renderCell(colId);

    expect(bars()).toHaveLength(1);
    expect(bars()[0].classList).toContain('rounded-full');
    expect(bars()[0].classList).toContain('w-16');
  });

  it('draws nothing for the actions column', async () => {
    const { element } = await renderCell('actions');

    expect(element.querySelector('span')).toBeNull();
  });

  it('hides the bars from assistive technology, pulsing only when motion is allowed', async () => {
    const { element, bars } = await renderCell('name');

    expect(element.querySelector(':scope > span')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.textContent?.trim()).toBe('');
    for (const bar of bars()) {
      expect(bar.classList).toContain('bg-skeleton');
      expect(bar.classList).toContain('motion-safe:animate-pulse');
      expect(bar.classList).not.toContain('animate-pulse');
    }
  });

  it('draws nothing while no request is in flight, and follows the loading state', async () => {
    const { fixture, element, loading } = await renderCell('email', signal(false));
    expect(element.querySelector('span')).toBeNull();

    loading.set(true);
    await fixture.whenStable();
    expect(element.querySelector('span')).not.toBeNull();

    loading.set(false);
    await fixture.whenStable();
    expect(element.querySelector('span')).toBeNull();
  });

  it('asks the grid to recreate the cell on refresh', async () => {
    const { fixture } = await renderCell('name');

    expect(fixture.componentInstance.refresh()).toBe(false);
  });
});
