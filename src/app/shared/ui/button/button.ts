import { computed, Directive, input, type InputSignal, type Signal } from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'outline-inverse';
export type ButtonSize = 'small' | 'medium' | 'large' | 'adaptive';

/**
 * Styles a native `<button>` or a link as a design-system button (see `styles/components`). The
 * element keeps its own semantics, so links stay links and buttons stay buttons.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant: InputSignal<ButtonVariant> = input<ButtonVariant>('primary');
  readonly size: InputSignal<ButtonSize> = input<ButtonSize>('medium');

  protected readonly classes: Signal<string> = computed(
    () => `button button--${this.variant()} button--${this.size()}`,
  );
}
