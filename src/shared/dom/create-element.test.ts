import { describe, expect, it } from 'vitest';

import { createElement } from './create-element';

describe('createElement', () => {
  it('creates an empty element of the given tag', () => {
    const element: HTMLButtonElement = createElement('button');

    expect(element.tagName).toBe('BUTTON');
    expect(element.className).toBe('');
    expect(element.childNodes).toHaveLength(0);
  });

  it('applies the class, attributes and text', () => {
    const element: HTMLAnchorElement = createElement('a', {
      className: 'link link--active',
      text: 'Library',
      attributes: { href: '/library', 'aria-current': 'page' },
    });

    expect(element.classList.contains('link--active')).toBe(true);
    expect(element.textContent).toBe('Library');
    expect(element.getAttribute('href')).toBe('/library');
    expect(element.getAttribute('aria-current')).toBe('page');
  });

  it('appends nodes and strings as children in order', () => {
    const icon: HTMLSpanElement = createElement('span', { className: 'icon' });
    const element: HTMLParagraphElement = createElement('p', { children: [icon, 'Hello'] });

    expect(element.firstChild).toBe(icon);
    expect(element.lastChild?.textContent).toBe('Hello');
  });

  it('inserts text as text, never as HTML', () => {
    const element: HTMLDivElement = createElement('div', { text: '<img src=x onerror=alert(1)>' });

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
