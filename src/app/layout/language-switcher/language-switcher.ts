import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  type InputSignal,
  signal,
  type Signal,
  viewChild,
  viewChildren,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageStore } from '@/core/i18n/language.store';
import { type Language, LANGUAGE_NAMES, LANGUAGES } from '@/core/i18n/languages';
import { Icon } from '@/shared/ui/icon/icon';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

let nextId: number = 0;

/**
 * Language dropdown of the header and the mobile menu. Every language is named in itself, the
 * list works with the keyboard like a native select, and the switch happens without a reload.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [Icon, TranslocoPipe],
  template: `
    <button
      #toggle
      class="language-switcher__toggle"
      type="button"
      aria-haspopup="listbox"
      [id]="toggleId"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="listId"
      [attr.aria-label]="'language.change' | transloco: { name: names[languages.language()] }"
      (click)="toggleList()"
      (keydown.arrowdown)="openFromKeyboard($event)"
      (keydown.arrowup)="openFromKeyboard($event)"
    >
      <span class="language-switcher__code">{{ languages.language() }}</span>
      <app-icon class="language-switcher__arrow" name="arrowDropDown" />
    </button>
    <ul
      class="language-switcher__list"
      role="listbox"
      [id]="listId"
      [hidden]="!isOpen()"
      [attr.aria-label]="'language.label' | transloco"
    >
      @for (language of options; track language; let index = $index) {
        <li
          #option
          class="language-switcher__option"
          role="option"
          tabindex="-1"
          [attr.lang]="language"
          [attr.aria-selected]="language === languages.language()"
          (click)="select(language)"
          (keydown)="onListKeydown($event)"
        >
          <app-icon class="language-switcher__check" name="check" />
          <span>{{ names[language] }}</span>
        </li>
      }
    </ul>
  `,
  styleUrl: './language-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.language-switcher--inverse]': 'inverse()',
    '(document:pointerdown)': 'onOutsidePress($event)',
  },
})
export class LanguageSwitcher {
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly snackbar: Snackbar = inject(Snackbar);
  private readonly toggle: Signal<ElementRef<HTMLButtonElement>> =
    viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  private readonly items: Signal<readonly ElementRef<HTMLLIElement>[]> =
    viewChildren<ElementRef<HTMLLIElement>>('option');

  /**
   * Light colors for the dark mobile menu.
   */
  readonly inverse: InputSignal<boolean> = input<boolean>(false);

  protected readonly languages: LanguageStore = inject(LanguageStore);
  protected readonly options: readonly Language[] = LANGUAGES;
  protected readonly names: Readonly<Record<Language, string>> = LANGUAGE_NAMES;
  protected readonly isOpen: WritableSignal<boolean> = signal(false);
  protected readonly toggleId: string = `language-toggle-${String(nextId)}`;
  protected readonly listId: string = `language-list-${String(nextId++)}`;

  private focusItem(index: number): void {
    const items: readonly ElementRef<HTMLLIElement>[] = this.items();
    const count: number = items.length;

    items[((index % count) + count) % count]?.nativeElement.focus();
  }

  private selectedIndex(): number {
    return Math.max(this.options.indexOf(this.languages.language()), 0);
  }

  private open(): void {
    this.isOpen.set(true);
    // The list is shown in the same tick; the focus moves once it is rendered.
    queueMicrotask(() => {
      this.focusItem(this.selectedIndex());
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

  protected async select(language: Language): Promise<void> {
    this.close(true);

    if (language === this.languages.language()) {
      return;
    }

    try {
      await this.languages.use(language);
    } catch {
      this.snackbar.show({ message: 'language.failed', variant: 'error' });
    }
  }

  protected onListKeydown(event: KeyboardEvent): void {
    const index: number = this.items().findIndex(
      (item: ElementRef<HTMLLIElement>) => item.nativeElement === document.activeElement,
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

        const language: Language | undefined = this.options[index];

        if (language !== undefined) {
          void this.select(language);
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
