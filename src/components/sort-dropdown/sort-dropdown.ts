import './sort-dropdown.scss';

import arrowDropDownIcon from '@/assets/icons/arrow-drop-down.svg?raw';
import checkIcon from '@/assets/icons/check.svg?raw';
import type { SortOption } from '@/shared/constants/library';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

const TOGGLE_ID: string = 'sort-toggle';
const LIST_ID: string = 'sort-options';

function createOption(option: SortOption, isSelected: boolean): HTMLLIElement {
  return createElement('li', {
    className: 'sort-dropdown__option',
    attributes: {
      role: 'option',
      tabindex: '-1',
      'aria-selected': String(isSelected),
      'data-value': option.value,
    },
    children: [
      createIcon(checkIcon, 'sort-dropdown__check'),
      createElement('span', { text: option.label }),
    ],
  });
}

/**
 * Custom select for the sort method: the chosen option is always shown in the control.
 * Sorting the list comes with the API.
 */
export function createSortDropdown(options: readonly SortOption[], value: string): HTMLElement {
  const current: HTMLSpanElement = createElement('span', { className: 'sort-dropdown__value' });
  const toggle: HTMLButtonElement = createElement('button', {
    className: 'sort-dropdown__toggle',
    attributes: {
      id: TOGGLE_ID,
      type: 'button',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': LIST_ID,
    },
    children: [
      createElement('span', { children: ['Sort by: ', current] }),
      createIcon(arrowDropDownIcon, 'sort-dropdown__arrow'),
    ],
  });
  const items: HTMLLIElement[] = options.map((option: SortOption): HTMLLIElement =>
    createOption(option, option.value === value),
  );
  const list: HTMLUListElement = createElement('ul', {
    className: 'sort-dropdown__list',
    attributes: { id: LIST_ID, role: 'listbox', 'aria-labelledby': TOGGLE_ID },
    children: items,
  });
  const element: HTMLElement = createElement('div', {
    className: 'sort-dropdown',
    children: [toggle, list],
  });

  list.hidden = true;
  current.textContent =
    options.find((option: SortOption): boolean => option.value === value)?.label ?? '';

  const isOpen = (): boolean => toggle.getAttribute('aria-expanded') === 'true';

  const focusItem = (index: number): void => {
    items.at(index % items.length)?.focus();
  };

  const open = (): void => {
    toggle.setAttribute('aria-expanded', 'true');
    list.hidden = false;
    focusItem(
      Math.max(
        items.findIndex((item: HTMLLIElement): boolean => item.ariaSelected === 'true'),
        0,
      ),
    );
  };

  const close = (shouldReturnFocus: boolean): void => {
    toggle.setAttribute('aria-expanded', 'false');
    list.hidden = true;

    if (shouldReturnFocus) {
      toggle.focus();
    }
  };

  const select = (item: HTMLLIElement): void => {
    for (const other of items) {
      other.setAttribute('aria-selected', String(other === item));
    }

    current.textContent = item.textContent;
    close(true);
  };

  toggle.addEventListener('click', (): void => {
    if (isOpen()) {
      close(false);
    } else {
      open();
    }
  });

  toggle.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    open();
  });

  list.addEventListener('click', (event: MouseEvent): void => {
    const item: HTMLLIElement | null = (event.target as Element).closest('li');

    if (item !== null) {
      select(item);
    }
  });

  list.addEventListener('keydown', (event: KeyboardEvent): void => {
    const index: number = items.indexOf(document.activeElement as HTMLLIElement);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        focusItem(index + 1);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        focusItem(index - 1);
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusItem(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusItem(-1);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item: HTMLLIElement | undefined = items[index];

        if (item !== undefined) {
          select(item);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        close(true);
        break;
      }
      case 'Tab': {
        close(false);
        break;
      }
      default: {
        break;
      }
    }
  });

  // A press anywhere outside closes the list. The Library page is rebuilt on every visit, so a
  // detached dropdown removes its listener.
  const handleOutsidePress = (event: PointerEvent): void => {
    if (!element.isConnected) {
      document.removeEventListener('pointerdown', handleOutsidePress);
      return;
    }

    if (isOpen() && !element.contains(event.target as Node)) {
      close(false);
    }
  };

  document.addEventListener('pointerdown', handleOutsidePress);

  return element;
}
