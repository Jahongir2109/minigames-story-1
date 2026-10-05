import './spinner.scss';

import { createElement } from '@/shared/dom/create-element';

// The icons that the spinners stand in for, restored when the request ends.
const hiddenIcons: WeakMap<HTMLSpanElement, Element> = new WeakMap<HTMLSpanElement, Element>();

/**
 * A decorative loading ring for pending buttons; the button itself announces the state with
 * `aria-busy`.
 */
export function createSpinner(): HTMLSpanElement {
  return createElement('span', { className: 'spinner', attributes: { 'aria-hidden': 'true' } });
}

function addSpinner(button: HTMLButtonElement): void {
  const spinner: HTMLSpanElement = createSpinner();
  const icon: Element | null = button.querySelector('svg');

  if (icon === null) {
    button.prepend(spinner);
    return;
  }

  hiddenIcons.set(spinner, icon);
  icon.replaceWith(spinner);
}

function removeSpinner(spinner: HTMLSpanElement): void {
  const icon: Element | undefined = hiddenIcons.get(spinner);

  if (icon === undefined) {
    spinner.remove();
    return;
  }

  spinner.replaceWith(icon);
}

/**
 * Locks a button while its request is pending and swaps its icon for a spinner.
 */
export function setButtonPending(button: HTMLButtonElement, isPending: boolean): void {
  const spinner: HTMLSpanElement | null = button.querySelector('.spinner');

  button.disabled = isPending;
  button.setAttribute('aria-busy', String(isPending));

  if (isPending && spinner === null) {
    addSpinner(button);
  } else if (!isPending && spinner !== null) {
    removeSpinner(spinner);
  }
}
