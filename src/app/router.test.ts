import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createElement } from '@/shared/dom/create-element';

import { navigate } from './navigation';
import { createRouter, type RouteName, type Router } from './router';

interface Setup {
  root: HTMLElement;
  onChange: Mock<(route: RouteName) => void>;
  renderHome: Mock<() => HTMLElement>;
}

function page(name: string): HTMLElement {
  return createElement('main', { className: `page-${name}` });
}

// Each test has its own root; the router listeners of older tests act on detached roots.
function setup(path: string): Setup {
  history.replaceState(null, '', path);

  const outlet: HTMLElement = createElement('main');
  const root: HTMLElement = createElement('div', { children: [outlet] });
  const onChange: Mock<(route: RouteName) => void> = vi.fn();
  const renderHome: Mock<() => HTMLElement> = vi.fn((): HTMLElement => page('home'));
  const router: Router = createRouter({
    outlet,
    root,
    notFound: (): HTMLElement => page('not-found'),
    routes: [
      { name: 'home', path: '/', aliases: ['/home'], render: renderHome },
      { name: 'library', path: '/library', render: (): HTMLElement => page('library') },
    ],
    onChange,
  });

  document.body.append(root);
  router.start();

  return { root, onChange, renderHome };
}

function currentPage(root: HTMLElement): string | undefined {
  return root.firstElementChild?.className;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('createRouter', () => {
  it('renders the page of the current path', () => {
    const { root, onChange } = setup('/library');

    expect(currentPage(root)).toBe('page-library');
    expect(onChange).toHaveBeenCalledWith('library');
  });

  it('opens a page from its alias and ignores a trailing slash', () => {
    expect(currentPage(setup('/home').root)).toBe('page-home');
    expect(currentPage(setup('/library/').root)).toBe('page-library');
  });

  it('renders the 404 page for an unknown path', () => {
    const { root, onChange } = setup('/missing');

    expect(currentPage(root)).toBe('page-not-found');
    expect(onChange).toHaveBeenCalledWith('not-found');
  });

  it('switches pages on navigation and keeps the page for a query change', () => {
    const { root, onChange, renderHome } = setup('/');

    navigate('/library');
    expect(currentPage(root)).toBe('page-library');

    navigate('/library?page=2');
    expect(onChange).toHaveBeenCalledTimes(2);

    navigate('/');
    expect(currentPage(root)).toBe('page-home');
    expect(renderHome).toHaveBeenCalledTimes(2);
  });

  it('follows the Back button', () => {
    const { root } = setup('/');

    navigate('/library');
    history.replaceState(null, '', '/');
    dispatchEvent(new PopStateEvent('popstate'));

    expect(currentPage(root)).toBe('page-home');
  });

  it('handles app link clicks without a reload', () => {
    const { root } = setup('/');
    const link: HTMLAnchorElement = createElement('a', {
      text: 'Library',
      attributes: { href: '/library' },
    });

    root.append(link);

    const click: MouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(location.pathname).toBe('/library');
    expect(currentPage(root)).toBe('page-library');
  });
});
