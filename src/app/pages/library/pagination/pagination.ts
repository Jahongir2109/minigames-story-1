import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Icon } from '@/shared/ui/icon/icon';

// Up to 4 page buttons on tablet and desktop, 3 on mobile (mockup). Mirrors `$bp-narrow`.
const WIDE_QUERY: string = '(min-width: 577px)';
const MAX_PAGES_WIDE: number = 4;
const MAX_PAGES_MOBILE: number = 3;

/**
 * Page numbers of a window of `size` buttons that keeps `current` as close to its middle as the
 * page range allows.
 */
export function getVisiblePages(current: number, total: number, size: number): number[] {
  const count: number = Math.min(size, total);
  const lastStart: number = total - count + 1;
  const start: number = Math.min(Math.max(current - Math.floor((count - 1) / 2), 1), lastStart);

  return Array.from({ length: count }, (_: unknown, index: number) => start + index);
}

/**
 * Page switcher of the Library, built from the `page` / `totalPages` metadata of the API. A
 * click only reports the requested page; the URL decides the current one.
 */
@Component({
  selector: 'app-pagination',
  imports: [Icon, TranslocoPipe],
  template: `
    <nav class="pagination" [attr.aria-label]="'library.pages' | transloco">
      <button
        class="pagination__button pagination__arrow"
        type="button"
        [attr.aria-label]="'library.previousPage' | transloco"
        [disabled]="current() <= 1"
        (click)="go(current() - 1)"
      >
        <app-icon class="pagination__icon" name="chevronBack" />
      </button>
      <ul class="pagination__pages">
        @for (page of pages(); track page) {
          <li>
            <button
              class="pagination__button pagination__page"
              type="button"
              [attr.aria-label]="'library.page' | transloco: { page: page }"
              [attr.aria-current]="page === current() ? 'page' : null"
              (click)="go(page)"
            >
              {{ page }}
            </button>
          </li>
        }
      </ul>
      <button
        class="pagination__button pagination__arrow"
        type="button"
        [attr.aria-label]="'library.nextPage' | transloco"
        [disabled]="current() >= total()"
        (click)="go(current() + 1)"
      >
        <app-icon class="pagination__icon" name="chevronForward" />
      </button>
    </nav>
  `,
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document: Document = inject(DOCUMENT);
  private readonly isWide: WritableSignal<boolean> = signal(false);
  // The keyboard focus stays on the page control that was used, also when its button is gone.
  private wasUsed: boolean = false;

  readonly page: InputSignal<number> = input.required<number>();
  readonly totalPages: InputSignal<number> = input.required<number>();
  readonly changed: OutputEmitterRef<number> = output<number>();

  // An empty list still shows page 1.
  protected readonly total: Signal<number> = computed(() => Math.max(this.totalPages(), 1));
  protected readonly current: Signal<number> = computed(() => Math.max(this.page(), 1));
  protected readonly pages: Signal<number[]> = computed(() =>
    getVisiblePages(
      Math.min(this.current(), this.total()),
      this.total(),
      this.isWide() ? MAX_PAGES_WIDE : MAX_PAGES_MOBILE,
    ),
  );

  constructor() {
    const query: MediaQueryList | undefined = this.document.defaultView?.matchMedia(WIDE_QUERY);
    const update = (): void => {
      this.isWide.set(query?.matches ?? false);
    };

    update();
    query?.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => {
      query?.removeEventListener('change', update);
    });

    afterRenderEffect(() => {
      this.pages();

      if (!this.wasUsed) {
        return;
      }

      const active: Element | null = this.document.activeElement;
      const isDisabled: boolean = active instanceof HTMLButtonElement && active.disabled;

      if (isDisabled || !this.host.contains(active)) {
        this.host.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
      }
    });
  }

  protected go(page: number): void {
    const target: number = Math.min(Math.max(page, 1), this.total());

    if (target === this.current()) {
      return;
    }

    this.wasUsed = true;
    this.changed.emit(target);
  }
}
