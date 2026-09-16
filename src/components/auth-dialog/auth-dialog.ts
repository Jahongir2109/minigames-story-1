import './auth-dialog.scss';

export type AuthMode = 'login' | 'register';

const OPEN_EVENT = 'auth-dialog:open';

export function openAuthDialog(mode: AuthMode = 'login'): void {
  window.dispatchEvent(new CustomEvent<AuthMode>(OPEN_EVENT, { detail: mode }));
}

export function createAuthDialog(): HTMLDialogElement {
  const dialog = document.createElement('dialog');
  dialog.className = 'auth-dialog';
  dialog.setAttribute('aria-labelledby', 'auth-dialog-title');

  dialog.innerHTML = `
    <div class="auth-dialog__panel">
      <button type="button" class="auth-dialog__close" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <div class="auth-dialog__tabs" role="tablist" aria-label="Authentication mode">
        <button type="button" class="auth-dialog__tab" role="tab" data-mode="login" aria-selected="true">
          Log in
        </button>
        <button type="button" class="auth-dialog__tab" role="tab" data-mode="register" aria-selected="false">
          Sign up
        </button>
      </div>

      <h2 id="auth-dialog-title" class="auth-dialog__title" data-title></h2>

      <form class="auth-dialog__form" data-form="login" novalidate>
        <div class="field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autocomplete="current-password"
            minlength="8"
            required
          />
        </div>
        <a class="auth-dialog__forgot" href="#">Forgot password?</a>
        <button type="submit" class="btn btn--primary btn--block">Log in</button>
      </form>

      <form class="auth-dialog__form" data-form="register" hidden novalidate>
        <div class="field">
          <label for="register-name">Nickname</label>
          <input id="register-name" name="name" type="text" autocomplete="nickname" required />
        </div>
        <div class="field">
          <label for="register-email">Email</label>
          <input id="register-email" name="email" type="email" autocomplete="email" required />
        </div>
        <div class="field">
          <label for="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <div class="field">
          <label for="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            name="confirm"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>
        <button type="submit" class="btn btn--primary btn--block">Create account</button>
      </form>

      <p class="auth-dialog__switch-hint" data-hint></p>
    </div>
  `;

  const tabs = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  const forms = Array.from(dialog.querySelectorAll<HTMLFormElement>('[data-form]'));
  const title = dialog.querySelector<HTMLHeadingElement>('[data-title]');
  const hint = dialog.querySelector<HTMLParagraphElement>('[data-hint]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('.auth-dialog__close');

  const copy: Record<AuthMode, { title: string; hint: string }> = {
    login: { title: 'Welcome back', hint: "Don't have an account? Sign up above." },
    register: { title: 'Create your account', hint: 'Already have an account? Log in above.' },
  };

  function setMode(mode: AuthMode): void {
    for (const tab of tabs) {
      const isActive = tab.dataset['mode'] === mode;
      tab.setAttribute('aria-selected', String(isActive));
    }
    for (const form of forms) {
      form.hidden = form.dataset['form'] !== mode;
    }
    if (title) title.textContent = copy[mode].title;
    if (hint) hint.textContent = copy[mode].hint;
  }

  function requestClose(): void {
    dialog.close();
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const mode = tab.dataset['mode'] as AuthMode;
      setMode(mode);
    });
  }

  closeButton?.addEventListener('click', requestClose);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) requestClose();
  });

  for (const form of forms) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      requestClose();
    });
  }

  window.addEventListener(OPEN_EVENT, (event) => {
    const mode = (event as CustomEvent<AuthMode>).detail;
    setMode(mode);
    dialog.showModal();
  });

  return dialog;
}
