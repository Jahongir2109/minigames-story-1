import { DOCUMENT } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  type Signal,
  signal,
  type WritableSignal,
} from '@angular/core';
import { type Event, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { DialogUrl } from '@/core/dialogs/dialog-url';
import { STORAGE } from '@/core/storage/storage';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import {
  type AuthRequest,
  Authenticator,
  getAuthErrorKey,
  isAuthCancellation,
} from './authenticator';
import { type AppSession, createSessionStore, type SessionStore } from './session';

const SUCCESS_MESSAGES: Readonly<Record<AuthRequest['kind'], string>> = {
  login: 'auth.welcomeBack',
  register: 'auth.accountReady',
  google: 'auth.googleWelcome',
};

/**
 * The app session as a signal: the header, the menu and the dialogs follow it. It lives in
 * localStorage for 5 minutes from the sign-in (see SessionStore) and is checked on startup, when
 * the page becomes visible again and on every navigation, so an expired session never survives
 * into the next screen.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly authenticator: Authenticator = inject(Authenticator);
  private readonly snackbar: Snackbar = inject(Snackbar);
  private readonly dialogs: DialogUrl = inject(DialogUrl);
  private readonly document: Document = inject(DOCUMENT);
  private readonly router: Router = inject(Router);
  private readonly current: WritableSignal<AppSession | undefined> = signal(undefined);
  private isWatching: boolean = false;

  private readonly store: SessionStore = createSessionStore({
    storage: inject(STORAGE),
    signOut: () => this.authenticator.signOut(),
    onExpire: () => {
      this.snackbar.show({ message: 'auth.expired', variant: 'info' });
    },
  });

  readonly user: Signal<AppSession | undefined> = this.current.asReadonly();
  readonly isSignedIn: Signal<boolean> = computed(() => this.current() !== undefined);

  constructor() {
    this.store.subscribe((session: AppSession | undefined) => {
      this.current.set(session);
    });
  }

  /**
   * Restores a valid session and keeps checking it (called once by the app).
   */
  watch(): void {
    this.check();

    if (this.isWatching) {
      return;
    }

    this.isWatching = true;
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'visible') {
        this.check();
      }
    });
    this.document.defaultView?.addEventListener('pageshow', () => {
      this.check();
    });
    this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.check();
      });
  }

  /**
   * The valid session, or `undefined` for a guest; an expired session is ended on the way.
   */
  check(): AppSession | undefined {
    return this.store.check();
  }

  /**
   * Signs in with Firebase, then starts the app session. Resolves `true` on success; failures
   * (and a cancelled Google window) are reported with a Snackbar.
   */
  async authenticate(request: AuthRequest): Promise<boolean> {
    try {
      this.store.start(await this.authenticator.signIn(request));
      this.snackbar.show({ message: SUCCESS_MESSAGES[request.kind], variant: 'success' });

      return true;
    } catch (error: unknown) {
      this.snackbar.show({
        message: getAuthErrorKey(error),
        variant: isAuthCancellation(error) ? 'info' : 'error',
      });

      return false;
    }
  }

  /**
   * Ends the app session and the Firebase sign-in. The app is in Guest Mode either way; a failed
   * Firebase sign-out is only reported.
   */
  async logout(): Promise<void> {
    try {
      await this.store.end();
      this.snackbar.show({ message: 'auth.loggedOut', variant: 'success' });
    } catch {
      this.snackbar.show({ message: 'auth.logoutFailed', variant: 'error' });
    }
  }

  /**
   * Guards a protected action (favorite, comment, like): returns the valid session, or
   * `undefined` when the action must not be sent. A guest is told why (`warning`) and gets Auth
   * over the current view; the action is not repeated after the sign-in. A session that expires
   * right now has already shown its own message.
   */
  require(warning: string): AppSession | undefined {
    const wasSignedIn: boolean = this.isSignedIn();
    const session: AppSession | undefined = this.check();

    if (session !== undefined) {
      return session;
    }

    if (!wasSignedIn) {
      this.snackbar.show({ message: warning, variant: 'warning' });
    }

    this.dialogs.open('auth', 'login', { stack: true });

    return undefined;
  }
}
