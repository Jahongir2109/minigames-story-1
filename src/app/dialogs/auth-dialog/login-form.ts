import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

import type { LoginRequest } from '@/core/auth/authenticator';
import { validateEmail, validateLoginPassword, type ValidationError } from '@/core/auth/validation';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';
import { TextField } from '@/shared/ui/text-field/text-field';

import { toValidator, visibleError } from './form-validation';

/**
 * Login with email and password, or with Google. The submit button stays disabled while a field
 * is invalid; everything is locked while a request is pending.
 */
@Component({
  selector: 'app-login-form',
  imports: [Button, Icon, ReactiveFormsModule, TextField, TranslocoPipe],
  template: `
    <div class="auth-form" [attr.aria-busy]="pending()">
      <header class="auth-form__header">
        <h2 class="auth-form__title">{{ 'auth.loginTitle' | transloco }}</h2>
        <p class="auth-form__subtitle">{{ 'auth.loginSubtitle' | transloco }}</p>
      </header>
      <form
        class="auth-form__form"
        novalidate
        [formGroup]="form"
        [attr.aria-label]="'auth.login' | transloco"
        (ngSubmit)="submit()"
      >
        <div class="auth-form__fields">
          <app-text-field
            fieldId="login-email"
            name="email"
            type="email"
            label="auth.email"
            placeholder="auth.emailPlaceholder"
            autocomplete="email"
            icon="mail"
            [control]="form.controls.email"
            [error]="error(form.controls.email)"
          />
          <app-text-field
            fieldId="login-password"
            name="password"
            type="password"
            label="auth.password"
            placeholder="auth.passwordPlaceholder"
            autocomplete="current-password"
            icon="lock"
            [control]="form.controls.password"
            [error]="error(form.controls.password)"
          />
          <button class="auth-form__link auth-form__forgot" type="button" [disabled]="pending()">
            {{ 'auth.forgot' | transloco }}
          </button>
        </div>
        <div class="auth-form__actions">
          <button
            class="auth-form__submit"
            type="submit"
            appButton
            size="large"
            [disabled]="pending() || form.invalid"
          >
            {{ (pending() ? 'auth.pending' : 'auth.login') | transloco }}
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
            {{ 'auth.googleLogin' | transloco }}
          </button>
        </div>
      </form>
      <p class="auth-form__prompt">
        {{ 'auth.noAccount' | transloco }}
        <button
          class="auth-form__link auth-form__switch"
          type="button"
          [disabled]="pending()"
          (click)="switchMode.emit()"
        >
          {{ 'auth.register' | transloco }}
        </button>
      </p>
    </div>
  `,
  styleUrl: './auth-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly pending: InputSignal<boolean> = input<boolean>(false);
  /**
   * The trimmed values of a valid form.
   */
  readonly submitted: OutputEmitterRef<LoginRequest> = output<LoginRequest>();
  readonly google: OutputEmitterRef<void> = output();
  readonly switchMode: OutputEmitterRef<void> = output();

  protected readonly form = new FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>({
    email: new FormControl('', { nonNullable: true, validators: toValidator(validateEmail) }),
    password: new FormControl('', {
      nonNullable: true,
      validators: toValidator(validateLoginPassword),
    }),
  });

  constructor() {
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

    const { email, password } = this.form.getRawValue();

    this.submitted.emit({ kind: 'login', email: email.trim(), password });
  }
}
