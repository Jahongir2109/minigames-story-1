import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { SortValue } from '@/api/games';
import { SORT_OPTIONS } from '@/shared/constants/library';

import { createSortDropdown, type SortDropdown } from './sort-dropdown';

interface Setup {
  dropdown: SortDropdown;
  toggle: HTMLButtonElement;
  list: HTMLUListElement;
  onChange: Mock<(value: SortValue) => void>;
}

function setup(): Setup {
  const onChange: Mock<(value: SortValue) => void> = vi.fn();
  const dropdown: SortDropdown = createSortDropdown(SORT_OPTIONS, 'rating-desc', onChange);
  const toggle: HTMLButtonElement | null = dropdown.element.querySelector('button');
  const list: HTMLUListElement | null = dropdown.element.querySelector('ul');

  if (toggle === null || list === null) {
    throw new Error('The dropdown is incomplete');
  }

  document.body.append(dropdown.element);

  return { dropdown, toggle, list, onChange };
}

function press(target: HTMLElement, key: string): KeyboardEvent {
  const event: KeyboardEvent = new KeyboardEvent('keydown', { key, cancelable: true });

  target.dispatchEvent(event);

  return event;
}

function focusedValue(): string | undefined {
  return (document.activeElement as HTMLElement | null)?.dataset.value;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createSortDropdown', () => {
  it('shows the chosen sort method in the control', () => {
    const { dropdown, list } = setup();

    expect(dropdown.element.querySelector('.sort-dropdown__value')?.textContent).toBe(
      SORT_OPTIONS[1]?.label,
    );
    expect(list.hidden).toBe(true);

    dropdown.setValue('name-asc');

    expect(list.querySelector<HTMLElement>('[aria-selected="true"]')?.dataset.value).toBe(
      'name-asc',
    );
  });

  it('opens on the chosen option and closes with the toggle', () => {
    const { toggle, list } = setup();

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(list.hidden).toBe(false);
    expect(focusedValue()).toBe('rating-desc');

    toggle.click();
    expect(list.hidden).toBe(true);
  });

  it('reports a new option chosen with the mouse', () => {
    const { toggle, list, onChange } = setup();

    toggle.click();
    list.querySelector('[data-value="rating-desc"]')?.querySelector('span')?.click();
    toggle.click();
    list.querySelector<HTMLElement>('[data-value="name-desc"]')?.click();

    expect(onChange.mock.calls).toEqual([['name-desc']]);
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });

  it('is usable with the keyboard', () => {
    const { toggle, list, onChange } = setup();

    expect(press(toggle, 'ArrowDown').defaultPrevented).toBe(true);
    expect(focusedValue()).toBe('rating-desc');

    press(list, 'ArrowDown');
    expect(focusedValue()).toBe('name-asc');
    press(list, 'ArrowUp');
    press(list, 'ArrowUp');
    expect(focusedValue()).toBe('rating-asc');
    press(list, 'End');
    expect(focusedValue()).toBe('name-desc');
    press(list, 'Home');
    expect(focusedValue()).toBe('rating-asc');
    press(list, 'a');

    press(list, 'Enter');
    expect(onChange).toHaveBeenCalledWith('rating-asc');
    expect(list.hidden).toBe(true);
  });

  it('closes with Escape, Tab and a press outside', () => {
    const { toggle, list } = setup();

    press(toggle, 'ArrowUp');
    press(list, 'Escape');
    expect(list.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);

    press(toggle, 'Enter');
    expect(list.hidden).toBe(true);

    toggle.click();
    press(list, 'Tab');
    expect(list.hidden).toBe(true);

    toggle.click();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(list.hidden).toBe(true);
  });

  it('stays open for a press inside and forgets the page once removed', () => {
    const { dropdown, toggle, list } = setup();

    toggle.click();
    list.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(list.hidden).toBe(false);

    dropdown.element.remove();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(list.hidden).toBe(false);
  });
});
