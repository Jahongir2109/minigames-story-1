import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { showSnackbar } from './snackbar';

function messages(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.snackbar')];
}

function region(): HTMLElement | null {
  return document.querySelector('.snackbar-region');
}

beforeEach(() => {
  vi.useFakeTimers();
  region()?.replaceChildren();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showSnackbar', () => {
  it('shows a message in the top layer with its variant', () => {
    showSnackbar({ message: 'Saved', variant: 'success' });
    showSnackbar({ message: 'Failed', variant: 'error' });

    expect(messages().map((message: HTMLElement): string => message.className)).toEqual([
      'snackbar snackbar--success',
      'snackbar snackbar--error',
    ]);
    expect(messages()[0]?.getAttribute('role')).toBe('status');
    expect(messages()[1]?.getAttribute('role')).toBe('alert');
    expect(region()?.dataset.popoverOpen).toBe('true');
  });

  it('uses the info variant by default and hides itself after a while', () => {
    showSnackbar({ message: 'Hello' });

    expect(messages()[0]?.classList.contains('snackbar--info')).toBe(true);

    vi.advanceTimersByTime(4000);

    expect(messages()).toHaveLength(0);
  });

  it('stays while hovered or focused and continues afterwards', () => {
    showSnackbar({ message: 'Hello', duration: 1000 });
    const message: HTMLElement | undefined = messages()[0];

    message?.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(5000);
    expect(messages()).toHaveLength(1);

    message?.dispatchEvent(new Event('pointerleave'));
    message?.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(5000);
    expect(messages()).toHaveLength(1);

    message?.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(1000);
    expect(messages()).toHaveLength(0);
  });

  it('closes with its close button', () => {
    showSnackbar({ message: 'Hello' });

    document.querySelector<HTMLButtonElement>('.snackbar__close')?.click();

    expect(messages()).toHaveLength(0);
  });

  it('keeps only the three latest messages', () => {
    for (const text of ['1', '2', '3', '4']) {
      showSnackbar({ message: text });
    }

    expect(messages().map((message: HTMLElement): string => message.textContent)).toEqual([
      '2',
      '3',
      '4',
    ]);
  });
});
