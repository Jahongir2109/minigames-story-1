import './auth-dialog.scss';

import { createElement } from '@/shared/dom/create-element';
import { lockScroll, unlockScroll } from '@/shared/dom/scroll-lock';

import type { AuthRequest } from '@/auth/auth-service';

import { type AuthForm, type AuthMode, createLoginForm, createRegisterForm } from './auth-forms';

export interface AuthDialogOptions {
  /**
   * Called when the user switches between Login and Register inside the dialog.
   */
  onModeChange?: (mode: AuthMode) => void;
  /**
   * Signs the user in and starts the app session; resolves `true` on success. The dialog stays
   * locked meanwhile, closes on success and unlocks for a retry on failure.
   */
  authenticate: (request: AuthRequest) => Promise<boolean>;
}

export interface AuthDialog {
  element: HTMLDialogElement;
  open: (mode: AuthMode) => void;
  close: () => void;
}

interface AuthTab {
  mode: AuthMode;
  label: string;
}

const TABS: readonly AuthTab[] = [
  { mode: 'login', label: 'Login' },
  { mode: 'register', label: 'Register' },
];

const INSTANT_CLASS: string = 'auth-dialog__viewport--instant';

function getTabId(mode: AuthMode): string {
  return `auth-tab-${mode}`;
}

function getPanelId(mode: AuthMode): string {
  return `auth-panel-${mode}`;
}

function getNextMode(mode: AuthMode): AuthMode {
  return mode === 'login' ? 'register' : 'login';
}

export function createAuthDialog(options: AuthDialogOptions): AuthDialog {
  let currentMode: AuthMode = 'login';
  let isPending: boolean = false;

  const tabs: Record<AuthMode, HTMLButtonElement> = {
    login: createTab(TABS[0]),
    register: createTab(TABS[1]),
  };
  const forms: Record<AuthMode, AuthForm> = {
    login: createLoginForm({ onSwitch: selectMode, onSubmit: submit, onGoogle: submitGoogle }),
    register: createRegisterForm({
      onSwitch: selectMode,
      onSubmit: submit,
      onGoogle: submitGoogle,
    }),
  };
  const panels: Record<AuthMode, HTMLElement> = {
    login: createPanel('login', forms.login.element),
    register: createPanel('register', forms.register.element),
  };

  const tabList: HTMLElement = createElement('div', {
    className: 'auth-dialog__tabs',
    attributes: { role: 'tablist', 'aria-label': 'Authentication mode' },
    children: [tabs.login, tabs.register],
  });
  const viewport: HTMLElement = createElement('div', {
    className: 'auth-dialog__viewport',
    children: [panels.login, panels.register],
  });
  const surface: HTMLElement = createElement('div', {
    className: 'auth-dialog__surface',
    children: [tabList, viewport],
  });
  const element: HTMLDialogElement = createElement('dialog', {
    className: 'auth-dialog',
    attributes: { 'aria-label': 'Log in or create an account' },
    children: [surface],
  });

  function createTab(definition: AuthTab | undefined): HTMLButtonElement {
    if (definition === undefined) {
      throw new RangeError('Auth tab definition is missing.');
    }

    const tab: HTMLButtonElement = createElement('button', {
      className: 'auth-dialog__tab',
      text: definition.label,
      attributes: {
        id: getTabId(definition.mode),
        type: 'button',
        role: 'tab',
        'aria-controls': getPanelId(definition.mode),
      },
    });

    tab.addEventListener('click', (): void => {
      selectMode(definition.mode);
    });

    return tab;
  }

  function createPanel(mode: AuthMode, content: HTMLElement): HTMLElement {
    return createElement('div', {
      className: `auth-dialog__panel auth-dialog__panel--${mode}`,
      attributes: { id: getPanelId(mode), role: 'tabpanel', 'aria-labelledby': getTabId(mode) },
      children: [content],
    });
  }

  // The dialog is as tall as the visible panel; the change of height is animated with CSS.
  function syncHeight(): void {
    viewport.style.height = `${String(panels[currentMode].offsetHeight)}px`;
  }

  function resetForms(): void {
    forms.login.reset();
    forms.register.reset();
  }

  function setMode(mode: AuthMode): void {
    // Switching between Login and Register starts the other form from scratch.
    if (mode !== currentMode) {
      resetForms();
    }

    currentMode = mode;

    for (const definition of TABS) {
      const isActive: boolean = definition.mode === mode;
      const tab: HTMLButtonElement = tabs[definition.mode];
      const panel: HTMLElement = panels[definition.mode];

      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panel.dataset.active = String(isActive);
      panel.inert = !isActive;
    }

    syncHeight();
  }

  // A switch made by the user inside the dialog (tabs, keyboard, the links under the forms).
  function selectMode(mode: AuthMode): void {
    if (mode === currentMode || isPending) {
      return;
    }

    setMode(mode);
    options.onModeChange?.(mode);
  }

  tabList.addEventListener('keydown', (event: KeyboardEvent): void => {
    const keys: readonly string[] = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (!keys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    const target: AuthMode =
      event.key === 'Home' ? 'login' : event.key === 'End' ? 'register' : getNextMode(currentMode);

    selectMode(target);
    tabs[target].focus();
  });

  // Fonts and viewport changes can resize the panels while the dialog is open.
  const resizeObserver: ResizeObserver = new ResizeObserver(syncHeight);

  resizeObserver.observe(panels.login);
  resizeObserver.observe(panels.register);

  function setPending(isActive: boolean): void {
    isPending = isActive;
    forms.login.setPending(isActive);
    forms.register.setPending(isActive);
    tabs.login.disabled = isActive;
    tabs.register.disabled = isActive;
    surface.setAttribute('aria-busy', String(isActive));
  }

  const close = (): void => {
    // A pending request keeps the dialog open: it closes itself on success.
    if (!isPending) {
      element.close();
    }
  };

  async function run(request: AuthRequest): Promise<void> {
    if (isPending) {
      return;
    }

    setPending(true);

    let isSuccess: boolean;

    try {
      isSuccess = await options.authenticate(request);
    } finally {
      setPending(false);
    }

    if (isSuccess) {
      close();
    }
  }

  function submit(request: AuthRequest): void {
    void run(request);
  }

  function submitGoogle(): void {
    void run({ kind: 'google' });
  }

  const open = (mode: AuthMode): void => {
    if (element.open) {
      if (mode !== currentMode && !isPending) {
        setMode(mode);
      }

      return;
    }

    element.showModal();
    lockScroll();

    // Measure without animating, so the dialog does not grow from zero height.
    viewport.classList.add(INSTANT_CLASS);
    setMode(mode);
    requestAnimationFrame((): void => {
      viewport.classList.remove(INSTANT_CLASS);
    });
  };

  // Escape cannot close the dialog while a request is pending.
  element.addEventListener('cancel', (event: Event): void => {
    if (isPending) {
      event.preventDefault();
    }
  });
  element.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (isPending && event.key === 'Escape') {
      event.preventDefault();
    }
  });

  // Covers the Escape key as well as the programmatic close; the next opening starts empty.
  element.addEventListener('close', (): void => {
    unlockScroll();
    resetForms();
  });

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  element.addEventListener('click', (event: MouseEvent): void => {
    if (event.target === element) {
      close();
    }
  });

  setMode('login');

  return { element, open, close };
}
