import { describe, expect, it } from 'vitest';

import { createElement } from '@/shared/dom/create-element';

import { createSpinner, setButtonPending } from './spinner';

function createIconButton(): HTMLButtonElement {
  const icon: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  return createElement('button', { children: [icon, 'Send'] });
}

describe('createSpinner', () => {
  it('is decorative', () => {
    expect(createSpinner().getAttribute('aria-hidden')).toBe('true');
  });
});

describe('setButtonPending', () => {
  it('locks the button and swaps the icon for a spinner', () => {
    const button: HTMLButtonElement = createIconButton();

    setButtonPending(button, true);

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('svg')).toBeNull();
    expect(button.firstElementChild?.classList.contains('spinner')).toBe(true);
  });

  it('adds only one spinner when called twice', () => {
    const button: HTMLButtonElement = createIconButton();

    setButtonPending(button, true);
    setButtonPending(button, true);

    expect(button.querySelectorAll('.spinner')).toHaveLength(1);
  });

  it('restores the icon when the request ends', () => {
    const button: HTMLButtonElement = createIconButton();
    const icon: Element | null = button.querySelector('svg');

    setButtonPending(button, true);
    setButtonPending(button, false);

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(button.querySelector('.spinner')).toBeNull();
    expect(button.firstElementChild).toBe(icon);
  });

  it('puts the spinner before the text of a button without an icon', () => {
    const button: HTMLButtonElement = createElement('button', { text: 'Save' });

    setButtonPending(button, true);
    expect(button.firstElementChild?.classList.contains('spinner')).toBe(true);

    setButtonPending(button, false);
    expect(button.textContent).toBe('Save');
    expect(button.children).toHaveLength(0);
  });
});
