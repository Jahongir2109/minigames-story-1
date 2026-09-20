import './auth-dialog.scss';

import { createElement } from '@/shared/dom/create-element';
import { lockScroll, unlockScroll } from '@/shared/dom/scroll-lock';

import { type AuthMode, createLoginForm, createRegisterForm } from './auth-forms';

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

export function createAuthDialog(): AuthDialog {
  let currentMode: AuthMode = 'login';

  const tabs: Record<AuthMode, HTMLButtonElement> = {
    login: createTab(TABS[0]),
    register: createTab(TABS[1]),
  };
  const panels: Record<AuthMode, HTMLElement> = {
    login: createPanel('login', createLoginForm({ onSwitch: setMode })),
    register: createPanel('register', createRegisterForm({ onSwitch: setMode })),
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
      setMode(definition.mode);
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

  function setMode(mode: AuthMode): void {
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

  tabList.addEventListener('keydown', (event: KeyboardEvent): void => {
    const keys: readonly string[] = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

    if (!keys.includes(event.key)) {
      return;
    }

    event.preventDefault();

    const target: AuthMode =
      event.key === 'Home' ? 'login' : event.key === 'End' ? 'register' : getNextMode(currentMode);

    setMode(target);
    tabs[target].focus();
  });

  // Fonts and viewport changes can resize the panels while the dialog is open.
  const resizeObserver: ResizeObserver = new ResizeObserver(syncHeight);

  resizeObserver.observe(panels.login);
  resizeObserver.observe(panels.register);

  const open = (mode: AuthMode): void => {
    if (!element.open) {
      element.showModal();
      lockScroll();
    }

    // Measure without animating, so the dialog does not grow from zero height.
    viewport.classList.add(INSTANT_CLASS);
    setMode(mode);
    requestAnimationFrame((): void => {
      viewport.classList.remove(INSTANT_CLASS);
    });
  };

  const close = (): void => {
    element.close();
  };

  // Covers the Escape key as well as the programmatic close.
  element.addEventListener('close', unlockScroll);

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  element.addEventListener('click', (event: MouseEvent): void => {
    if (event.target === element) {
      close();
    }
  });

  setMode('login');

  return { element, open, close };
}
