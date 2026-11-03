import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import type { RegisterRequest } from '@/core/auth/authenticator';
import {
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
  type ValidationError,
} from '@/core/auth/validation';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';
import { TextField } from '@/shared/ui/text-field/text-field';

import { toValidator, visibleError } from './form-validation';

/**
 * Registration with username, email and a strong password, or with Google. The confirmation
 * follows the password: changing the password checks the confirmation again.
 */
@Component({
  selector: 'app-register-form',
  imports: [Button, Icon, ReactiveFormsModule, TextField, TranslocoPipe],
  template: `
    <div class="auth-form" [attr.aria-busy]="pending()">
      <header class="auth-form__header">
        <h2 class="auth-form__title">{{ 'auth.registerTitle' | transloco }}</h2>
        <p class="auth-form__subtitle">{{ 'auth.registerSubtitle' | transloco }}</p>
      </header>
      <form
        class="auth-form__form"
        novalidate
        [formGroup]="form"
        [attr.aria-label]="'auth.registration' | transloco"
        (ngSubmit)="submit()"
      >
        <div class="auth-form__fields">
          <app-text-field
            fieldId="register-username"
            name="username"
            label="auth.username"
            placeholder="auth.usernamePlaceholder"
            autocomplete="username"
            icon="user"
            [control]="form.controls.username"
            [error]="error(form.controls.username)"
          />
          <app-text-field
            fieldId="register-email"
            name="email"
            type="email"
            label="auth.email"
            placeholder="auth.newEmailPlaceholder"
            autocomplete="email"
            icon="mail"
            [control]="form.controls.email"
            [error]="error(form.controls.email)"
          />
          <app-text-field
            fieldId="register-password"
            name="password"
            type="password"
            label="auth.password"
            placeholder="auth.newPasswordPlaceholder"
            autocomplete="new-password"
            icon="lock"
            [control]="form.controls.password"
            [error]="error(form.controls.password)"
          />
          <app-text-field
            fieldId="register-password-confirmation"
            name="password-confirmation"
            type="password"
            label="auth.confirmPassword"
            placeholder="auth.confirmPlaceholder"
            autocomplete="new-password"
            icon="lock"
            [control]="form.controls.confirmation"
            [error]="error(form.controls.confirmation)"
          />
        </div>
        <div class="auth-form__actions">
          <button
            class="auth-form__submit"
            type="submit"
            appButton
            size="large"
            [disabled]="pending() || form.invalid"
          >
            {{ (pending() ? 'auth.pending' : 'auth.createAccount') | transloco }}
          </button>
          <p class="auth-form__divider">
            <span>{{ 'auth.or' | transloco }}</span>
          </p>
          <button
            class="auth-form__google"
            type="button"
            appButton
            variant="outline"
            size="large"
            [disabled]="pending()"
            (click)="google.emit()"
          >
            <app-icon class="button__icon" name="google" />
            {{ 'auth.googleRegister' | transloco }}
          </button>
        </div>
      </form>
      <p class="auth-form__prompt">
        {{ 'auth.hasAccount' | transloco }}
        <button
          class="auth-form__link auth-form__switch"
          type="button"
          [disabled]="pending()"
          (click)="switchMode.emit()"
        >
          {{ 'auth.login' | transloco }}
        </button>
      </p>
    </div>
  `,
  styleUrl: './auth-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  private readonly password = new FormControl<string>('', {
    nonNullable: true,
    validators: toValidator(validateNewPassword),
  });

  readonly pending: InputSignal<boolean> = input<boolean>(false);
  /**
   * The values of a valid form (the email trimmed).
   */
  readonly submitted: OutputEmitterRef<RegisterRequest> = output<RegisterRequest>();
  readonly google: OutputEmitterRef<void> = output();
  readonly switchMode: OutputEmitterRef<void> = output();

  protected readonly form = new FormGroup<{
    username: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    confirmation: FormControl<string>;
  }>({
    username: new FormControl('', { nonNullable: true, validators: toValidator(validateUsername) }),
    email: new FormControl('', { nonNullable: true, validators: toValidator(validateEmail) }),
    password: this.password,
    // Only the match is checked: the password rules are not applied to the confirmation again.
    confirmation: new FormControl('', {
      nonNullable: true,
      validators: toValidator((value: string) =>
        validatePasswordConfirmation(this.password.value, value),
      ),
    }),
  });

  constructor() {
    this.password.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmation.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      if (this.pending()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  /**
   * Clears the values and the errors.
   */
  reset(): void {
    this.form.reset();
  }

  protected error(control: FormControl<string>): ValidationError | undefined {
    return visibleError(control);
  }

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.pending()) {
      return;
    }

    const { username, email, password } = this.form.getRawValue();

    this.submitted.emit({ kind: 'register', username, email: email.trim(), password });
  }
}
