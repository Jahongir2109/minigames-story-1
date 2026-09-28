import './pagination.scss';

import chevronBackIcon from '@/assets/icons/chevron-back.svg?raw';
import chevronForwardIcon from '@/assets/icons/chevron-forward.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

// Up to 4 page buttons on tablet and desktop, 3 on mobile (mockup). Mirrors `$bp-narrow`.
const WIDE_QUERY: string = '(min-width: 577px)';
const MAX_PAGES_WIDE: number = 4;
const MAX_PAGES_MOBILE: number = 3;

/**
 * Page numbers of a window of `size` buttons that keeps `current` as close to its middle as the
 * page range allows.
 */
export function getVisiblePages(current: number, total: number, size: number): number[] {
  const count: number = Math.min(size, total);
  const lastStart: number = total - count + 1;
  const start: number = Math.min(Math.max(current - Math.floor((count - 1) / 2), 1), lastStart);

  return Array.from({ length: count }, (_: unknown, index: number): number => start + index);
}

function createArrow(label: string, icon: string, step: number): HTMLButtonElement {
  return createElement('button', {
    className: 'pagination__button pagination__arrow',
    attributes: { type: 'button', 'aria-label': label, 'data-step': String(step) },
    children: [createIcon(icon, 'pagination__icon')],
  });
}

export interface Pagination {
  element: HTMLElement;
  /**
   * Rebuilds the controls from the metadata of the API response. An empty list still shows page 1.
   */
  update: (page: number, totalPages: number) => void;
}

/**
 * Page switcher of the Library, built from the page / 	otalPages metadata of the API. A click
 * only reports the requested page; the owner loads it and calls update.
 */
export function createPagination(onChange: (page: number) => void): Pagination {
  let currentPage: number = 1;
  let totalPages: number = 1;
  const wideQuery: MediaQueryList = matchMedia(WIDE_QUERY);

  const previous: HTMLButtonElement = createArrow('Previous page', chevronBackIcon, -1);
  const next: HTMLButtonElement = createArrow('Next page', chevronForwardIcon, 1);
  const pages: HTMLUListElement = createElement('ul', { className: 'pagination__pages' });
  const element: HTMLElement = createElement('nav', {
    className: 'pagination',
    attributes: { 'aria-label': 'Library pages' },
    children: [previous, pages, next],
  });

  const createPageButton = (page: number): HTMLLIElement => {
    const button: HTMLButtonElement = createElement('button', {
      className: 'pagination__button pagination__page',
      text: String(page),
      attributes: { type: 'button', 'aria-label': `Page ${String(page)}` },
    });

    if (page === currentPage) {
      button.setAttribute('aria-current', 'page');
    }

    button.addEventListener('click', (): void => {
      if (page !== currentPage) {
        onChange(page);
      }
    });

    return createElement('li', { children: [button] });
  };

  const render = (): void => {
    const size: number = wideQuery.matches ? MAX_PAGES_WIDE : MAX_PAGES_MOBILE;
    // Keeps the keyboard focus on the page control that was used after the buttons are rebuilt.
    const wasFocused: boolean = element.contains(document.activeElement);

    pages.replaceChildren(
      ...getVisiblePages(Math.min(currentPage, totalPages), totalPages, size).map(
        (page: number): HTMLLIElement => createPageButton(page),
      ),
    );
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;

    const active: Element | null = document.activeElement;
    const hasLostFocus: boolean =
      !element.contains(active) || (active instanceof HTMLButtonElement && active.disabled);

    if (wasFocused && hasLostFocus) {
      pages.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
    }
  };

  const update = (page: number, total: number): void => {
    totalPages = Math.max(total, 1);
    currentPage = Math.max(page, 1);
    render();
  };

  for (const arrow of [previous, next]) {
    arrow.addEventListener('click', (): void => {
      const target: number = Math.min(
        Math.max(currentPage + Number(arrow.dataset.step), 1),
        totalPages,
      );

      if (target !== currentPage) {
        onChange(target);
      }
    });
  }

  // The Library page is rebuilt on every visit, so a detached pagination stops listening.
  const handleBreakpointChange = (): void => {
    if (!element.isConnected) {
      wideQuery.removeEventListener('change', handleBreakpointChange);
      return;
    }

    render();
  };

  wideQuery.addEventListener('change', handleBreakpointChange);
  render();

  return { element, update };
}
