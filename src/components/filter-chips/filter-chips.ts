import './filter-chips.scss';

import { createElement } from '@/shared/dom/create-element';
import type { GameCategory } from '@/shared/types/game';

// Pointer travel (px) after which a press on the chip row is a drag, not a click.
const DRAG_THRESHOLD: number = 5;

function createChip(category: GameCategory): HTMLButtonElement {
  return createElement('button', {
    className: 'filter-chips__chip',
    text: category.label,
    attributes: {
      type: 'button',
      'aria-pressed': String(category.isDefault),
      'data-category': category.slug,
    },
  });
}

/**
 * Chips that do not fit stay on one line; touch devices swipe the row natively, this adds the
 * same behaviour for a mouse drag.
 */
function enableDragScroll(row: HTMLElement): void {
  let pointerId: number | undefined;
  let startX: number = 0;
  let startScroll: number = 0;
  let isDragging: boolean = false;

  row.addEventListener('pointerdown', (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = row.scrollLeft;
    isDragging = false;
  });

  row.addEventListener('pointermove', (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) {
      return;
    }

    const distance: number = event.clientX - startX;

    if (!isDragging && Math.abs(distance) > DRAG_THRESHOLD) {
      isDragging = true;
      row.setPointerCapture(event.pointerId);
      row.classList.add('filter-chips--dragging');
    }

    if (isDragging) {
      row.scrollLeft = startScroll - distance;
    }
  });

  const stopDrag = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) {
      return;
    }

    pointerId = undefined;
    row.classList.remove('filter-chips--dragging');
  };

  row.addEventListener('pointerup', stopDrag);
  row.addEventListener('pointercancel', stopDrag);

  // The click that ends a drag must not select the chip under the pointer.
  row.addEventListener(
    'click',
    (event: MouseEvent): void => {
      if (!isDragging) {
        return;
      }

      event.stopPropagation();
      isDragging = false;
    },
    { capture: true },
  );
}

/**
 * Category filter: exactly one chip is active. Filtering the list comes with the API.
 */
export function createFilterChips(categories: readonly GameCategory[]): HTMLElement {
  const chips: HTMLButtonElement[] = categories.map((category: GameCategory): HTMLButtonElement =>
    createChip(category),
  );
  const row: HTMLElement = createElement('div', {
    className: 'filter-chips',
    attributes: { role: 'group', 'aria-label': 'Filter games by category' },
    children: chips,
  });

  for (const chip of chips) {
    chip.addEventListener('click', (): void => {
      for (const other of chips) {
        other.setAttribute('aria-pressed', String(other === chip));
      }
    });
  }

  enableDragScroll(row);

  return row;
}
