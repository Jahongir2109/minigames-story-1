import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { GameCategory } from '@/core/api/models';

import { CategoryLabelPipe } from '../category-label.pipe';

// Pointer travel (px) after which a press on the chip row is a drag, not a click.
const DRAG_THRESHOLD: number = 5;

/**
 * Category filter: exactly one chip is active. The chips stay on one line; touch devices swipe
 * the row natively and a mouse can drag it. A click only reports the category; the URL decides
 * the active chip.
 */
@Component({
  selector: 'app-filter-chips',
  imports: [CategoryLabelPipe, TranslocoPipe],
  template: `
    <div
      #row
      class="filter-chips"
      role="group"
      [class.filter-chips--dragging]="isDragging()"
      [attr.aria-label]="'library.filterLabel' | transloco"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
    >
      @for (category of categories(); track category.slug) {
        <button
          class="filter-chips__chip"
          type="button"
          [attr.aria-pressed]="category.slug === value()"
          (click)="choose(category.slug)"
        >
          {{ category.slug | categoryLabel: category.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './filter-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChips {
  private readonly row: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('row');
  private pointerId: number | undefined;
  private startX: number = 0;
  private startScroll: number = 0;
  private hasDragged: boolean = false;

  // The click that ends a drag must not select the chip under the pointer.
  private readonly suppressClick = (event: MouseEvent): void => {
    if (!this.hasDragged) {
      return;
    }

    event.stopPropagation();
    this.hasDragged = false;
  };

  readonly categories: InputSignal<readonly GameCategory[]> =
    input.required<readonly GameCategory[]>();
  readonly value: InputSignal<string> = input.required<string>();
  readonly changed: OutputEmitterRef<string> = output<string>();

  protected readonly isDragging: WritableSignal<boolean> = signal(false);

  constructor() {
    afterNextRender(() => {
      this.row().nativeElement.addEventListener('click', this.suppressClick, { capture: true });
    });
    inject(DestroyRef).onDestroy(() => {
      this.row().nativeElement.removeEventListener('click', this.suppressClick, { capture: true });
    });
  }

  protected choose(slug: string): void {
    if (slug !== this.value()) {
      this.changed.emit(slug);
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startScroll = this.row().nativeElement.scrollLeft;
    this.hasDragged = false;
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    const row: HTMLElement = this.row().nativeElement;
    const distance: number = event.clientX - this.startX;

    if (!this.isDragging() && Math.abs(distance) > DRAG_THRESHOLD) {
      this.isDragging.set(true);
      this.hasDragged = true;
      row.setPointerCapture(event.pointerId);
    }

    if (this.isDragging()) {
      row.scrollLeft = this.startScroll - distance;
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    this.pointerId = undefined;
    this.isDragging.set(false);
  }
}
