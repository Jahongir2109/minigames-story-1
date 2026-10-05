import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createElement } from '@/shared/dom/create-element';

import { interceptLinks, navigate, onLocationChange } from './navigation';

// Listeners added by a test, removed after it.
const stoppers: (() => void)[] = [];

function listen(): Mock<() => void> {
  const listener: Mock<() => void> = vi.fn();

  stoppers.push(onLocationChange(listener));

  return listener;
}

function currentUrl(): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Clicks a link inside an intercepted root and tells whether the app handled the click. The root
 * stays outside the document, so happy-dom does not load another page for an unhandled click.
 */
function isClickHandled(
  attributes: Readonly<Record<string, string>>,
  init: MouseEventInit = {},
): boolean {
  const root: HTMLElement = createElement('div');
  const link: HTMLAnchorElement = createElement('a', {
    attributes,
    children: [createElement('span', { text: 'Go' })],
  });

  root.append(link);
  interceptLinks(root);

  let isHandled: boolean = false;

  // Registered after the router listener, so it sees its decision.
  root.addEventListener('click', (event: Event): void => {
    isHandled = event.defaultPrevented;
  });
  link.firstElementChild?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, ...init }),
  );

  return isHandled;
}

beforeEach(() => {
  history.replaceState(null, '', '/');
  // happy-dom follows a link while the click is still at the anchor, before the app sees it; a
  // browser does it after the dispatch. The plain element dispatch keeps the browser order.
  vi.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(function isDispatched(
    this: HTMLAnchorElement,
    event: Event,
  ): boolean {
    return HTMLElement.prototype.dispatchEvent.call(this, event);
  });
});

afterEach(() => {
  for (const stop of stoppers.splice(0)) {
    stop();
  }

  document.body.replaceChildren();
});

describe('navigate', () => {
  it('adds a history entry and notifies the listeners', () => {
    const listener: Mock<() => void> = listen();
    const length: number = history.length;

    navigate('/library?page=2', { state: { from: 'test' } });

    expect(currentUrl()).toBe('/library?page=2');
    expect(history.length).toBe(length + 1);
    expect(history.state).toEqual({ from: 'test' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('replaces the entry and keeps its state unless a new one is given', () => {
    history.replaceState({ kept: true }, '', '/');
    const length: number = history.length;

    navigate('/library', { replace: true });
    expect(history.state).toEqual({ kept: true });

    navigate('/home', { replace: true, state: null });
    expect(history.state).toBeNull();
    expect(history.length).toBe(length);
  });

  it('ignores the current URL', () => {
    const listener: Mock<() => void> = listen();

    navigate('/');

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after the listener is removed', () => {
    const listener: Mock<() => void> = listen();

    for (const stop of stoppers.splice(0)) {
      stop();
    }

    navigate('/library');
    dispatchEvent(new PopStateEvent('popstate'));

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('interceptLinks', () => {
  it('navigates in place for an app link', () => {
    expect(isClickHandled({ href: '/library?category=puzzle#top' })).toBe(true);
    expect(currentUrl()).toBe('/library?category=puzzle#top');
  });

  it.each([
    ['a modified click', { href: '/library' }, { ctrlKey: true }],
    ['a middle click', { href: '/library' }, { button: 1 }],
    ['a download', { href: '/file.pdf', download: '' }, {}],
    ['a new tab target', { href: '/library', target: '_blank' }, {}],
    ['an external link', { href: 'https://rs.school/' }, {}],
    ['an in-page anchor', { href: '#footer' }, {}],
  ])(
    'keeps the browser behavior for %s',
    (_name: string, attributes: Record<string, string>, init: MouseEventInit) => {
      expect(isClickHandled(attributes, init)).toBe(false);
      expect(currentUrl()).toBe('/');
    },
  );

  it('ignores clicks outside links and already handled clicks', () => {
    const root: HTMLElement = createElement('div', { text: 'text' });

    document.body.append(root);
    interceptLinks(root);

    const plain: MouseEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

    root.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(false);

    expect(isClickHandled({ href: '/library' })).toBe(true);
  });
});
