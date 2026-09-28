import './not-found-page.scss';

import { HOME_PATH, LIBRARY_PATH } from '@/shared/constants/links';
import { createElement } from '@/shared/dom/create-element';

const TITLE_ID: string = 'not-found-title';

function createLink(label: string, href: string, variant: 'primary' | 'outline'): HTMLElement {
  return createElement('a', {
    className: `button button--${variant} button--adaptive not-found__link`,
    text: label,
    attributes: { href },
  });
}

/**
 * Shown for every URL path that has no page; the address stays as typed.
 */
export function createNotFoundPage(): HTMLElement {
  const code: HTMLParagraphElement = createElement('p', {
    className: 'not-found__code',
    text: '404',
    attributes: { 'aria-hidden': 'true' },
  });
  const title: HTMLHeadingElement = createElement('h1', {
    className: 'not-found__title',
    text: 'Page Not Found',
    attributes: { id: TITLE_ID },
  });
  const description: HTMLParagraphElement = createElement('p', {
    className: 'not-found__description',
    text: 'The page you are looking for does not exist or has been moved.',
  });
  const actions: HTMLElement = createElement('div', {
    className: 'not-found__actions',
    children: [
      createLink('Back to Home', HOME_PATH, 'primary'),
      createLink('Browse Library', LIBRARY_PATH, 'outline'),
    ],
  });

  return createElement('main', {
    className: 'page not-found',
    attributes: { id: 'main-content', 'aria-labelledby': TITLE_ID },
    children: [code, title, description, actions],
  });
}
