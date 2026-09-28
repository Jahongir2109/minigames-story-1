import './snackbar.scss';

import closeIcon from '@/assets/icons/close.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

export type SnackbarVariant = 'info' | 'success' | 'error';

export interface SnackbarOptions {
  message: string;
  variant?: SnackbarVariant;
  /**
   * Time in milliseconds before the message hides itself.
   */
  duration?: number;
}

const DEFAULT_DURATION: number = 4000;
// Older messages are dropped so the stack never covers the page.
const MAX_VISIBLE: number = 3;

// A manual popover lives in the top layer, so messages stay visible above open modal dialogs.
const region: HTMLElement = createElement('div', {
  className: 'snackbar-region',
  attributes: { popover: 'manual', 'aria-live': 'polite' },
});

function getRegion(): HTMLElement {
  if (!region.isConnected) {
    document.body.append(region);
  }

  return region;
}

// Showing the popover again moves it above a dialog opened after it.
function bringToFront(element: HTMLElement): void {
  if (element.matches(':popover-open')) {
    element.hidePopover();
  }

  element.showPopover();
}

function createMessage(options: SnackbarOptions, onClose: () => void): HTMLElement {
  const variant: SnackbarVariant = options.variant ?? 'info';
  const text: HTMLParagraphElement = createElement('p', {
    className: 'snackbar__message',
    text: options.message,
  });
  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'snackbar__close',
    attributes: { type: 'button', 'aria-label': 'Dismiss notification' },
    children: [createIcon(closeIcon, 'snackbar__close-icon')],
  });

  closeButton.addEventListener('click', onClose);

  return createElement('div', {
    className: `snackbar snackbar--${variant}`,
    attributes: { role: variant === 'error' ? 'alert' : 'status' },
    children: [text, closeButton],
  });
}

/**
 * Shows a short non-blocking notification at the bottom of the screen (used instead of the
 * browser `alert()`). It hides itself after a while; hovering or focusing it keeps it open.
 */
export function showSnackbar(options: SnackbarOptions): void {
  const container: HTMLElement = getRegion();
  const duration: number = options.duration ?? DEFAULT_DURATION;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const dismiss = (): void => {
    clearTimeout(timer);
    message.remove();

    if (container.childElementCount === 0 && container.matches(':popover-open')) {
      container.hidePopover();
    }
  };
  const startTimer = (): void => {
    clearTimeout(timer);
    timer = setTimeout(dismiss, duration);
  };
  const stopTimer = (): void => {
    clearTimeout(timer);
  };

  const message: HTMLElement = createMessage(options, dismiss);

  message.addEventListener('pointerenter', stopTimer);
  message.addEventListener('pointerleave', startTimer);
  message.addEventListener('focusin', stopTimer);
  message.addEventListener('focusout', startTimer);

  bringToFront(container);
  container.append(message);

  while (container.childElementCount > MAX_VISIBLE) {
    container.firstElementChild?.remove();
  }

  startTimer();
}
