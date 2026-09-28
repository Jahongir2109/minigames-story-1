import './error-banner.scss';

import { createButton } from '@/components/ui/button/button';
import { createElement } from '@/shared/dom/create-element';

export interface ErrorBannerOptions {
  title?: string;
  message: string;
  /**
   * Repeats the failed request; without it the banner has no Retry button.
   */
  onRetry?: () => void;
  className?: string;
}

/**
 * Replaces an API-driven section whose request failed, so the rest of the page keeps working.
 */
export function createErrorBanner(options: ErrorBannerOptions): HTMLElement {
  const title: HTMLParagraphElement = createElement('p', {
    className: 'error-banner__title',
    text: options.title ?? 'Something went wrong',
  });
  const message: HTMLParagraphElement = createElement('p', {
    className: 'error-banner__message',
    text: options.message,
  });
  const text: HTMLElement = createElement('div', {
    className: 'error-banner__text',
    children: [title, message],
  });
  const banner: HTMLElement = createElement('div', {
    className: `error-banner${options.className === undefined ? '' : ` ${options.className}`}`,
    attributes: { role: 'alert' },
    children: [text],
  });

  if (options.onRetry !== undefined) {
    const retryButton: HTMLButtonElement = createButton({
      label: 'Try Again',
      variant: 'outline',
      size: 'small',
      className: 'error-banner__retry',
    });

    retryButton.addEventListener('click', options.onRetry);
    banner.append(retryButton);
  }

  return banner;
}
