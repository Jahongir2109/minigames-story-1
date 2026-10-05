import { createAppSessionStore, watchSession } from '@/auth/app-session';
import type { SessionStore } from '@/auth/session';
import { type AuthDialog, createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import type { AuthMode } from '@/components/auth-dialog/auth-forms';
import { createFooter } from '@/components/footer/footer';
import { createGameDialog, type GameDialog } from '@/components/game-dialog/game-dialog';
import { createHeader, type Header } from '@/components/header/header';
import { createMobileMenu, type MobileMenu } from '@/components/mobile-menu/mobile-menu';
import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';
import { createElement } from '@/shared/dom/create-element';
import { HOME_ALIAS_PATH, HOME_PATH, LIBRARY_PATH } from '@/shared/constants/links';
import type { Game } from '@/shared/types/game';

import { closeDialogUrl, getDialogParameter, openDialogUrl } from './dialog-url';
import { onLocationChange } from './navigation';
import { createRouter, type RouteName, type Router } from './router';

function isAuthMode(value: string | undefined): value is AuthMode {
  return value === 'login' || value === 'register';
}

// The dialogs follow the URL: opening one writes it into the URL, and closing one (button,
// backdrop, Escape) removes it again.
function openAuth(mode: AuthMode): void {
  openDialogUrl('auth', mode);
}

function openGame(game: Game): void {
  openDialogUrl('game', game.slug);
}

/**
 * Builds the whole page from TypeScript: the static HTML document only contains the script tag.
 */
export function mountApp(root: HTMLElement): void {
  const session: SessionStore = createAppSessionStore();
  const authDialog: AuthDialog = createAuthDialog({ onModeChange: openAuth });
  const gameDialog: GameDialog = createGameDialog();

  authDialog.element.addEventListener('close', (): void => {
    closeDialogUrl('auth');
  });
  gameDialog.element.addEventListener('close', (): void => {
    closeDialogUrl('game');
  });

  const header: Header = createHeader({
    onLogin: (): void => {
      openAuth('login');
    },
    onSignUp: (): void => {
      openAuth('register');
    },
    onMenuOpen: (): void => {
      menu.open();
    },
  });
  // The menu closes itself before it asks for the dialog.
  const menu: MobileMenu = createMobileMenu({
    trigger: header.menuButton,
    onLogin: (): void => {
      openAuth('login');
    },
    onSignUp: (): void => {
      openAuth('register');
    },
  });

  // Replaced by the page of the current route as soon as the router starts.
  const outlet: HTMLElement = createElement('main');

  root.replaceChildren(
    header.element,
    outlet,
    createFooter(),
    menu.element,
    authDialog.element,
    gameDialog.element,
  );

  const router: Router = createRouter({
    outlet,
    root,
    notFound: createNotFoundPage,
    routes: [
      {
        name: 'home',
        path: HOME_PATH,
        aliases: [HOME_ALIAS_PATH],
        render: (): HTMLElement => createHomePage({ onGameDetails: openGame }),
      },
      {
        name: 'library',
        path: LIBRARY_PATH,
        render: (): HTMLElement => createLibraryPage({ onGameDetails: openGame }),
      },
    ],
    onChange: (route: RouteName): void => {
      header.setCurrentRoute(route);
      menu.setCurrentRoute(route);
    },
  });

  // Opens, switches or closes the dialogs to match the URL (links, Back / Forward, reloads).
  const syncDialogs = (): void => {
    const slug: string | undefined = getDialogParameter('game');
    const mode: string | undefined = getDialogParameter('auth');

    if (slug === undefined) {
      gameDialog.close();
    } else {
      gameDialog.open(slug);
    }

    if (isAuthMode(mode)) {
      authDialog.open(mode);
    } else {
      authDialog.close();
    }
  };

  // Registered before the router, so every navigation sees an up-to-date session.
  watchSession(session);
  router.start();
  onLocationChange(syncDialogs);
  syncDialogs();
}
