import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  viewChild,
  viewChildren,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { SortValue } from '@/core/api/models';
import { Icon } from '@/shared/ui/icon/icon';

import { DEFAULT_SORT, SORT_OPTIONS, type SortOption } from '../library-state';

const FALLBACK_OPTION: SortOption = { value: DEFAULT_SORT, label: 'library.sort.ratingDesc' };

/**
 * Custom select for the sort method: the chosen option is always shown in the control, the list
 * works with the keyboard like a native select. Choosing an option only reports it; the URL
 * decides the value.
 */
@Component({
  selector: 'app-sort-dropdown',
  imports: [Icon, TranslocoPipe],
  template: `
    <button
      #toggle
      class="sort-dropdown__toggle"
      id="sort-toggle"
      type="button"
      aria-haspopup="listbox"
      aria-controls="sort-options"
      [attr.aria-expanded]="isOpen()"
      (click)="toggleList()"
      (keydown.arrowdown)="openFromKeyboard($event)"
      (keydown.arrowup)="openFromKeyboard($event)"
    >
      <span>
        {{ 'library.sortBy' | transloco }}
        <span class="sort-dropdown__value">{{ selected().label | transloco }}</span>
      </span>
      <app-icon class="sort-dropdown__arrow" name="arrowDropDown" />
    </button>
    <ul
      class="sort-dropdown__list"
      id="sort-options"
      role="listbox"
      aria-labelledby="sort-toggle"
      [hidden]="!isOpen()"
    >
      @for (option of options; track option.value) {
        <li
          #option
          class="sort-dropdown__option"
          role="option"
          tabindex="-1"
          [attr.aria-selected]="option.value === value()"
          (click)="select(option)"
          (keydown)="onOptionKeydown($event)"
        >
          <app-icon class="sort-dropdown__check" name="check" />
          <span>{{ option.label | transloco }}</span>
        </li>
      }
    </ul>
  `,
  styleUrl: './sort-dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:pointerdown)': 'onOutsidePress($event)' },
})
export class SortDropdown {
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly toggle: Signal<ElementRef<HTMLButtonElement>> =
    viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  private readonly items: Signal<readonly ElementRef<HTMLLIElement>[]> =
    viewChildren<ElementRef<HTMLLIElement>>('option');

  readonly value: InputSignal<SortValue> = input.required<SortValue>();
  readonly changed: OutputEmitterRef<SortValue> = output<SortValue>();

  protected readonly options: readonly SortOption[] = SORT_OPTIONS;
  protected readonly isOpen: WritableSignal<boolean> = signal(false);
  protected readonly selected: Signal<SortOption> = computed(
    () =>
      this.options.find((option: SortOption) => option.value === this.value()) ?? FALLBACK_OPTION,
  );

  private focusItem(index: number): void {
    const items: readonly ElementRef<HTMLLIElement>[] = this.items();
    const count: number = items.length;

    items[((index % count) + count) % count]?.nativeElement.focus();
  }

  private open(): void {
    this.isOpen.set(true);

    const index: number = Math.max(this.options.indexOf(this.selected()), 0);

    // The list is shown in the same tick; the focus moves once it is rendered.
    queueMicrotask(() => {
      this.focusItem(index);
    });
  }

  private close(shouldReturnFocus: boolean): void {
    this.isOpen.set(false);

    if (shouldReturnFocus) {
      this.toggle().nativeElement.focus();
    }
  }

  protected toggleList(): void {
    if (this.isOpen()) {
      this.close(false);
    } else {
      this.open();
    }
  }

  protected openFromKeyboard(event: Event): void {
    event.preventDefault();
    this.open();
  }

  protected select(option: SortOption): void {
    this.close(true);

    if (option.value !== this.value()) {
      this.changed.emit(option.value);
    }
  }

  protected onOptionKeydown(event: KeyboardEvent): void {
    const target: EventTarget | null = event.currentTarget;
    const index: number = this.items().findIndex(
      (item: ElementRef<HTMLLIElement>) => item.nativeElement === target,
    );

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.focusItem(index + 1);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.focusItem(index - 1);
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.focusItem(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.focusItem(-1);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();

        const option: SortOption | undefined = this.options[index];

        if (option !== undefined) {
          this.select(option);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        this.close(true);
        break;
      }
      case 'Tab': {
        this.close(false);
        break;
      }
      default: {
        break;
      }
    }
  }

  protected onOutsidePress(event: PointerEvent): void {
    if (this.isOpen() && !this.host.contains(event.target as Node)) {
      this.close(false);
    }
  }
}
