import './auth-dialog.scss';

export type AuthMode = 'login' | 'register';

const OPEN_EVENT = 'auth-dialog:open';

export function openAuthDialog(mode: AuthMode = 'login'): void {
  globalThis.dispatchEvent(new CustomEvent<AuthMode>(OPEN_EVENT, { detail: mode }));
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
        <button
          type="button"
          class="auth-dialog__tab"
          id="auth-tab-login"
          role="tab"
          data-mode="login"
          aria-selected="true"
          aria-controls="auth-panel-login"
        >
          Log in
        </button>
        <button
          type="button"
          class="auth-dialog__tab"
          id="auth-tab-register"
          role="tab"
          data-mode="register"
          aria-selected="false"
          aria-controls="auth-panel-register"
        >
          Sign up
        </button>
      </div>

      <h2 id="auth-dialog-title" class="auth-dialog__title" data-title></h2>

      <div
        class="auth-dialog__form"
        data-form="login"
        id="auth-panel-login"
        role="tabpanel"
        aria-labelledby="auth-tab-login"
      >
        <form class="auth-dialog__fields" novalidate>
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
          <button type="button" class="auth-dialog__forgot">Forgot password?</button>
          <button type="submit" class="btn btn--primary btn--block">Log in</button>
        </form>
      </div>

      <div
        class="auth-dialog__form"
        data-form="register"
        id="auth-panel-register"
        role="tabpanel"
        aria-labelledby="auth-tab-register"
        hidden
      >
        <form class="auth-dialog__fields" novalidate>
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
      </div>

      <p class="auth-dialog__switch-hint">
        <span data-hint-text></span>
        <button type="button" class="auth-dialog__switch-link" data-hint-link></button>
      </p>
    </div>
  `;

  const tabs = [...dialog.querySelectorAll<HTMLButtonElement>('[data-mode]')];
  const panels = [...dialog.querySelectorAll<HTMLElement>('[data-form]')];
  const formElements = [...dialog.querySelectorAll<HTMLFormElement>('.auth-dialog__fields')];
  const title = dialog.querySelector<HTMLHeadingElement>('[data-title]');
  const hintText = dialog.querySelector<HTMLSpanElement>('[data-hint-text]');
  const hintLink = dialog.querySelector<HTMLButtonElement>('[data-hint-link]');
  const closeButton = dialog.querySelector<HTMLButtonElement>('.auth-dialog__close');

  const otherMode: Record<AuthMode, AuthMode> = { login: 'register', register: 'login' };

  const copy: Record<AuthMode, { title: string; hint: string; link: string }> = {
    login: { title: 'Welcome back', hint: "Don't have an account?", link: 'Sign up' },
    register: { title: 'Create your account', hint: 'Already have an account?', link: 'Log in' },
  };

  function setMode(mode: AuthMode): void {
    for (const tab of tabs) {
      const isActive = tab.dataset['mode'] === mode;
      tab.setAttribute('aria-selected', String(isActive));
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset['form'] !== mode;
    }
    if (title) title.textContent = copy[mode].title;
    if (hintText) hintText.textContent = copy[mode].hint;
    if (hintLink) hintLink.textContent = copy[mode].link;
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

  hintLink?.addEventListener('click', () => {
    const activePanel = panels.find((panel) => !panel.hidden);
    const activeMode = (activePanel?.dataset['form'] as AuthMode | undefined) ?? 'login';
    setMode(otherMode[activeMode]);
  });

  closeButton?.addEventListener('click', requestClose);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) requestClose();
  });

  for (const form of formElements) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      requestClose();
    });
  }

  globalThis.addEventListener(OPEN_EVENT, (event) => {
    const mode = (event as CustomEvent<AuthMode>).detail;
    setMode(mode);
    dialog.showModal();
  });

  return dialog;
}
