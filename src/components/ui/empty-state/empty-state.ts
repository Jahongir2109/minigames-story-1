import './empty-state.scss';

import { createElement } from '@/shared/dom/create-element';

export interface EmptyStateOptions {
  title: string;
  message?: string;
  /**
   * An optional way out, e.g. a "Reset filters" button or a link.
   */
  action?: HTMLElement;
  className?: string;
}

/**
 * Shown in place of a list when the request succeeded but returned no items.
 */
export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const children: HTMLElement[] = [
    createElement('p', { className: 'empty-state__title', text: options.title }),
  ];

  if (options.message !== undefined) {
    children.push(createElement('p', { className: 'empty-state__message', text: options.message }));
  }

  if (options.action !== undefined) {
    children.push(options.action);
  }

  return createElement('div', {
    className: `empty-state${options.className === undefined ? '' : ` ${options.className}`}`,
    attributes: { role: 'status' },
    children,
  });
}
