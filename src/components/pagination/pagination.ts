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

/**
 * Page switcher of the Library. It only updates its own state for now: the cards come from the
 * API later.
 */
export function createPagination(totalPages: number): HTMLElement {
  let currentPage: number = 1;
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
      goTo(page);
      // The buttons are rebuilt, so keep the keyboard focus on the new current page.
      pages.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
    });

    return createElement('li', { children: [button] });
  };

  const render = (): void => {
    const size: number = wideQuery.matches ? MAX_PAGES_WIDE : MAX_PAGES_MOBILE;

    pages.replaceChildren(
      ...getVisiblePages(currentPage, totalPages, size).map((page: number): HTMLLIElement =>
        createPageButton(page),
      ),
    );
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
  };

  function goTo(page: number): void {
    currentPage = Math.min(Math.max(page, 1), totalPages);
    render();
  }

  for (const arrow of [previous, next]) {
    arrow.addEventListener('click', (): void => {
      goTo(currentPage + Number(arrow.dataset.step));

      // A disabled button loses the focus; move it to the current page instead.
      if (arrow.disabled) {
        pages.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
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

  return element;
}
