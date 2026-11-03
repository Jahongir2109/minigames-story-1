import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  untracked,
  viewChild,
  viewChildren,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import type { AuthRequest } from '@/core/auth/authenticator';
import { Session } from '@/core/auth/session.service';
import { ScrollLock } from '@/shared/ui/scroll-lock';

import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

export type AuthMode = 'login' | 'register';

const MODES: readonly AuthMode[] = ['login', 'register'];

function otherMode(mode: AuthMode): AuthMode {
  return mode === 'login' ? 'register' : 'login';
}

/**
 * Login / Registration dialog. It is open while `mode` is set; the tabs and the links under the
 * forms switch the mode. While a request runs the dialog is locked (no switching, no closing);
 * it closes itself after a successful sign-in.
 */
@Component({
  selector: 'app-auth-dialog',
  imports: [LoginForm, RegisterForm, TranslocoPipe],
  template: `
    <dialog
      #dialog
      class="auth-dialog"
      [attr.aria-label]="'auth.dialogLabel' | transloco"
      (cancel)="onCancel($event)"
      (close)="onClosed()"
    >
      <div class="auth-dialog__surface" [attr.aria-busy]="pending()">
        <div
          class="auth-dialog__tabs"
          role="tablist"
          [attr.aria-label]="'auth.modeLabel' | transloco"
        >
          @for (tab of modes; track tab) {
            <button
              #tab
              class="auth-dialog__tab"
              type="button"
              role="tab"
              [id]="'auth-tab-' + tab"
              [attr.aria-controls]="'auth-panel-' + tab"
              [attr.aria-selected]="tab === shown()"
              [tabIndex]="tab === shown() ? 0 : -1"
              [disabled]="pending()"
              (click)="select(tab)"
              (keydown)="onTabKeydown($event)"
            >
              {{ (tab === 'login' ? 'auth.loginTab' : 'auth.registerTab') | transloco }}
            </button>
          }
        </div>
        <div
          class="auth-dialog__viewport"
          [class.auth-dialog__viewport--instant]="isInstant()"
          [style.height.px]="viewportHeight()"
        >
          <div
            #loginPanel
            class="auth-dialog__panel auth-dialog__panel--login"
            id="auth-panel-login"
            role="tabpanel"
            aria-labelledby="auth-tab-login"
            [attr.data-active]="shown() === 'login'"
            [inert]="shown() !== 'login'"
          >
            <app-login-form
              [pending]="pending()"
              (submitted)="run($event)"
              (google)="run({ kind: 'google' })"
              (switchMode)="select('register')"
            />
          </div>
          <div
            #registerPanel
            class="auth-dialog__panel auth-dialog__panel--register"
            id="auth-panel-register"
            role="tabpanel"
            aria-labelledby="auth-tab-register"
            [attr.data-active]="shown() === 'register'"
            [inert]="shown() !== 'register'"
          >
            <app-register-form
              [pending]="pending()"
              (submitted)="run($event)"
              (google)="run({ kind: 'google' })"
              (switchMode)="select('login')"
            />
          </div>
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './auth-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'onClick($event)' },
})
export class AuthDialog {
  private readonly session: Session = inject(Session);
  private readonly scrollLock: ScrollLock = inject(ScrollLock);
  private readonly dialog: Signal<ElementRef<HTMLDialogElement>> =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly loginPanel: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('loginPanel');
  private readonly registerPanel: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('registerPanel');
  private readonly tabs: Signal<readonly ElementRef<HTMLButtonElement>[]> =
    viewChildren<ElementRef<HTMLButtonElement>>('tab');
  private readonly loginForm: Signal<LoginForm> = viewChild.required(LoginForm);
  private readonly registerForm: Signal<RegisterForm> = viewChild.required(RegisterForm);
  // The app closes the dialog itself when the URL loses `auth`: that is not a close by the user.
  private isClosingByApp: boolean = false;

  /**
   * The mode in the URL; `undefined` closes the dialog.
   */
  readonly mode: InputSignal<AuthMode | undefined> = input<AuthMode>();
  /**
   * The user switched between Login and Register inside the dialog.
   */
  readonly modeChange: OutputEmitterRef<AuthMode> = output<AuthMode>();
  /**
   * The dialog was closed by the user or after a successful sign-in.
   */
  readonly closed: OutputEmitterRef<void> = output();

  protected readonly modes: readonly AuthMode[] = MODES;
  protected readonly shown: WritableSignal<AuthMode> = signal('login');
  protected readonly pending: WritableSignal<boolean> = signal(false);
  // The dialog is as tall as the visible panel; the change of height is animated.
  protected readonly viewportHeight: WritableSignal<number | null> = signal(null);
  protected readonly isInstant: WritableSignal<boolean> = signal(true);

  constructor() {
    let observer: ResizeObserver | undefined;

    // Fonts, the language and the viewport can resize the panels while the dialog is open.
    afterNextRender(() => {
      observer = new ResizeObserver(() => {
        this.syncHeight();
      });
      observer.observe(this.loginPanel().nativeElement);
      observer.observe(this.registerPanel().nativeElement);
    });
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
    });

    effect(() => {
      const mode: AuthMode | undefined = this.mode();

      untracked(() => {
        this.sync(mode);
      });
    });
  }

  private syncHeight(): void {
    const panel: ElementRef<HTMLElement> =
      this.shown() === 'login' ? this.loginPanel() : this.registerPanel();

    this.viewportHeight.set(panel.nativeElement.offsetHeight);
  }

  private resetForms(): void {
    this.loginForm().reset();
    this.registerForm().reset();
  }

  private show(mode: AuthMode): void {
    // Switching between Login and Register starts the other form from scratch.
    if (mode !== this.shown()) {
      this.resetForms();
    }

    this.shown.set(mode);
    this.syncHeight();
  }

  private sync(mode: AuthMode | undefined): void {
    const dialog: HTMLDialogElement = this.dialog().nativeElement;

    if (mode === undefined) {
      if (dialog.open) {
        this.isClosingByApp = true;
        dialog.close();
      }

      return;
    }

    if (dialog.open) {
      if (!this.pending()) {
        this.show(mode);
      }

      return;
    }

    dialog.showModal();
    this.scrollLock.lock();
    // Measured without animating, so the dialog does not grow from zero height.
    this.isInstant.set(true);
    this.show(mode);
    requestAnimationFrame(() => {
      this.isInstant.set(false);
    });
  }

  protected select(mode: AuthMode): void {
    if (mode === this.shown() || this.pending()) {
      return;
    }

    this.show(mode);
    this.modeChange.emit(mode);
  }

  protected onTabKeydown(event: KeyboardEvent): void {
    const keys: readonly string[] = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (!keys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    let target: AuthMode = otherMode(this.shown());

    if (event.key === 'Home') {
      target = 'login';
    } else if (event.key === 'End') {
      target = 'register';
    }

    this.select(target);
    this.tabs()[MODES.indexOf(target)]?.nativeElement.focus();
  }

  protected async run(request: AuthRequest): Promise<void> {
    if (this.pending()) {
      return;
    }

    this.pending.set(true);

    let isSuccess: boolean;

    try {
      isSuccess = await this.session.authenticate(request);
    } finally {
      this.pending.set(false);
    }

    if (isSuccess) {
      this.close();
    }
  }

  // A pending request keeps the dialog open: it closes itself on success.
  protected close(): void {
    if (!this.pending()) {
      this.dialog().nativeElement.close();
    }
  }

  // Escape cannot close the dialog while a request is pending.
  protected onCancel(event: Event): void {
    if (this.pending()) {
      event.preventDefault();
    }
  }

  // Covers Escape, the backdrop, a successful sign-in and the closes of the app; the next
  // opening starts empty.
  protected onClosed(): void {
    this.scrollLock.unlock();
    this.resetForms();

    if (this.isClosingByApp) {
      this.isClosingByApp = false;
      return;
    }

    this.closed.emit();
  }

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
