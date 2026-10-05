import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { GameCategory } from '@/shared/types/game';

import { createFilterChips, type FilterChips } from './filter-chips';

const CATEGORIES: GameCategory[] = [
  { slug: 'all', label: 'All', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'arcade', label: 'Arcade', isDefault: false },
];

function chip(chips: FilterChips, slug: string): HTMLButtonElement {
  const element: HTMLButtonElement | null = chips.element.querySelector(
    `[data-category="${CSS.escape(slug)}"]`,
  );

  if (element === null) {
    throw new Error(`No chip ${slug}`);
  }

  return element;
}

function mouse(type: string, clientX: number): PointerEvent {
  return new PointerEvent(type, { pointerId: 1, pointerType: 'mouse', button: 0, clientX });
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createFilterChips', () => {
  it('marks exactly one chip as active', () => {
    const chips: FilterChips = createFilterChips(CATEGORIES, 'all', vi.fn());

    expect(chip(chips, 'all').ariaPressed).toBe('true');
    expect(chip(chips, 'puzzle').ariaPressed).toBe('false');

    chips.setValue('puzzle');
    expect(chip(chips, 'all').ariaPressed).toBe('false');
    expect(chip(chips, 'puzzle').ariaPressed).toBe('true');
  });

  it('reports a new category but not the active one', () => {
    const onChange: Mock<(slug: string) => void> = vi.fn();
    const chips: FilterChips = createFilterChips(CATEGORIES, 'all', onChange);

    chip(chips, 'all').click();
    chip(chips, 'arcade').click();

    expect(onChange.mock.calls).toEqual([['arcade']]);
  });

  it('scrolls the row with a mouse drag and ignores the click at its end', () => {
    const onChange: Mock<(slug: string) => void> = vi.fn();
    const chips: FilterChips = createFilterChips(CATEGORIES, 'all', onChange);
    const row: HTMLElement = chips.element;

    row.setPointerCapture = vi.fn();
    row.scrollLeft = 50;
    row.dispatchEvent(mouse('pointerdown', 300));
    row.dispatchEvent(mouse('pointermove', 280));

    expect(row.classList.contains('filter-chips--dragging')).toBe(true);
    expect(row.scrollLeft).toBe(70);

    row.dispatchEvent(mouse('pointerup', 280));
    chip(chips, 'puzzle').click();

    expect(row.classList.contains('filter-chips--dragging')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();

    // The next click selects again.
    chip(chips, 'puzzle').click();
    expect(onChange).toHaveBeenCalledWith('puzzle');
  });

  it('leaves touch and small movements to the browser', () => {
    const chips: FilterChips = createFilterChips(CATEGORIES, 'all', vi.fn());
    const row: HTMLElement = chips.element;

    row.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, pointerType: 'touch' }));
    row.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 400 }));
    row.dispatchEvent(mouse('pointerdown', 300));
    row.dispatchEvent(mouse('pointermove', 298));
    row.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));

    expect(row.classList.contains('filter-chips--dragging')).toBe(false);
  });
});
