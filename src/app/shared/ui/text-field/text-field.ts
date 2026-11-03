import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type InputSignal,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import type { ValidationError } from '@/core/auth/validation';

import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

export type TextFieldType = 'text' | 'email' | 'password';

/**
 * A labelled input with an icon, a translated error under it and, for passwords, a show / hide
 * toggle. The error is described to screen readers through `aria-describedby`.
 */
@Component({
  selector: 'app-text-field',
  imports: [Icon, ReactiveFormsModule, TranslocoPipe],
  template: `
    <label class="text-field__label" [for]="fieldId()">{{ label() | transloco }}</label>
    <div class="text-field__control">
      <app-icon class="text-field__icon" [name]="icon()" />
      <input
        class="text-field__input"
        required
        [id]="fieldId()"
        [attr.name]="name()"
        [type]="inputType()"
        [attr.placeholder]="placeholder() | transloco"
        [attr.autocomplete]="autocomplete()"
        [attr.aria-invalid]="error() !== undefined"
        [attr.aria-describedby]="errorId()"
        [formControl]="control()"
      />
      @if (type() === 'password') {
        <button
          class="text-field__toggle"
          type="button"
          [disabled]="control().disabled"
          [attr.aria-pressed]="isRevealed()"
          [attr.aria-label]="(isRevealed() ? 'auth.hidePassword' : 'auth.showPassword') | transloco"
          (click)="isRevealed.set(!isRevealed())"
        >
          <app-icon class="text-field__toggle-icon" [name]="isRevealed() ? 'eyeOff' : 'eye'" />
        </button>
      }
    </div>
    <p class="text-field__error" aria-live="polite" [id]="errorId()">
      @if (error(); as message) {
        {{ message.key | transloco: message.params }}
      }
    </p>
  `,
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-invalid]': 'error() !== undefined' },
})
export class TextField {
  readonly control: InputSignal<FormControl<string>> = input.required<FormControl<string>>();
  readonly fieldId: InputSignal<string> = input.required<string>();
  readonly name: InputSignal<string> = input.required<string>();
  /**
   * Translation keys of the label and the placeholder.
   */
  readonly label: InputSignal<string> = input.required<string>();
  readonly placeholder: InputSignal<string> = input.required<string>();
  readonly type: InputSignal<TextFieldType> = input<TextFieldType>('text');
  readonly autocomplete: InputSignal<string> = input.required<string>();
  readonly icon: InputSignal<IconName> = input.required<IconName>();
  /**
   * The error to show; `undefined` while the value is valid or untouched.
   */
  readonly error: InputSignal<ValidationError | undefined> = input<ValidationError>();

  protected readonly isRevealed: WritableSignal<boolean> = signal(false);
  protected readonly errorId: Signal<string> = computed(() => `${this.fieldId()}-error`);
  protected readonly inputType: Signal<TextFieldType> = computed(() =>
    this.type() === 'password' && this.isRevealed() ? 'text' : this.type(),
  );
}
