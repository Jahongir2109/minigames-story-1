import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createPagination, getVisiblePages, type Pagination } from './pagination';

interface MediaStub {
  matches: boolean;
  listeners: (() => void)[];
}

const media: MediaStub = { matches: true, listeners: [] };

function pageNumbers(pagination: Pagination): string[] {
  return [...pagination.element.querySelectorAll('.pagination__page')].map(
    (button: Element): string => button.textContent,
  );
}

function button(pagination: Pagination, selector: string): HTMLButtonElement {
  const element: HTMLButtonElement | null = pagination.element.querySelector(selector);

  if (element === null) {
    throw new Error(`No ${selector}`);
  }

  return element;
}

beforeEach(() => {
  media.matches = true;
  media.listeners = [];
  vi.stubGlobal('matchMedia', (): Partial<MediaQueryList> => ({
    get matches(): boolean {
      return media.matches;
    },
    addEventListener: (_type: string, listener: unknown): void => {
      media.listeners.push(listener as () => void);
    },
    removeEventListener: (): void => {
      media.listeners = [];
    },
  }));
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('getVisiblePages', () => {
  it('keeps the current page near the middle', () => {
    expect(getVisiblePages(5, 10, 4)).toEqual([4, 5, 6, 7]);
    expect(getVisiblePages(5, 10, 3)).toEqual([4, 5, 6]);
  });

  it('stays inside the page range', () => {
    expect(getVisiblePages(1, 10, 4)).toEqual([1, 2, 3, 4]);
    expect(getVisiblePages(10, 10, 4)).toEqual([7, 8, 9, 10]);
    expect(getVisiblePages(2, 2, 4)).toEqual([1, 2]);
  });
});

describe('createPagination', () => {
  it('shows page 1 without results', () => {
    const pagination: Pagination = createPagination(vi.fn());

    pagination.update(1, 0);

    expect(pageNumbers(pagination)).toEqual(['1']);
    expect(button(pagination, '[aria-label="Previous page"]').disabled).toBe(true);
    expect(button(pagination, '[aria-label="Next page"]').disabled).toBe(true);
  });

  it('marks the current page and reports other pages', () => {
    const onChange: Mock<(page: number) => void> = vi.fn();
    const pagination: Pagination = createPagination(onChange);

    pagination.update(3, 10);

    expect(pageNumbers(pagination)).toEqual(['2', '3', '4', '5']);
    expect(button(pagination, '[aria-current="page"]').textContent).toBe('3');

    button(pagination, '[aria-current="page"]').click();
    button(pagination, '[aria-label="Page 4"]').click();
    button(pagination, '[aria-label="Previous page"]').click();
    button(pagination, '[aria-label="Next page"]').click();

    expect(onChange.mock.calls).toEqual([[4], [2], [4]]);
  });

  it('shows three pages on mobile and follows the breakpoint', () => {
    media.matches = false;
    const pagination: Pagination = createPagination(vi.fn());

    document.body.append(pagination.element);
    pagination.update(5, 10);
    expect(pageNumbers(pagination)).toEqual(['4', '5', '6']);

    media.matches = true;
    for (const listener of media.listeners) {
      listener();
    }

    expect(pageNumbers(pagination)).toEqual(['4', '5', '6', '7']);
  });

  it('stops following the breakpoint once removed', () => {
    // Never attached to the document, like a Library page that was left.
    createPagination(vi.fn());

    for (const listener of media.listeners) {
      listener();
    }

    expect(media.listeners).toHaveLength(0);
  });

  it('keeps the keyboard focus on the current page after the arrow gets disabled', () => {
    const pagination: Pagination = createPagination(vi.fn());

    document.body.append(pagination.element);
    pagination.update(9, 10);
    button(pagination, '[aria-label="Next page"]').focus();
    pagination.update(10, 10);

    expect(document.activeElement?.textContent).toBe('10');
  });
});
