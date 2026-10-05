import { createAppSessionStore, watchSession } from '@/auth/app-session';
import type { AuthRequest } from '@/auth/auth-service';
import { didAuthenticate, logOut } from '@/auth/authenticate';
import type { AppSession, SessionStore } from '@/auth/session';
import { type AuthDialog, createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import type { AuthMode } from '@/components/auth-dialog/auth-forms';
import { createFooter } from '@/components/footer/footer';
import { createGameDialog, type GameDialog } from '@/components/game-dialog/game-dialog';
import { createHeader, type Header } from '@/components/header/header';
import { createMobileMenu, type MobileMenu } from '@/components/mobile-menu/mobile-menu';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';
import { createElement } from '@/shared/dom/create-element';
import { HOME_ALIAS_PATH, HOME_PATH, LIBRARY_PATH } from '@/shared/constants/links';
import type { Game } from '@/shared/types/game';

import { ALREADY_AUTHENTICATED_MESSAGE, createDialogSync } from './dialog-sync';
import { closeDialogUrl, openDialogUrl } from './dialog-url';
import { onLocationChange } from './navigation';
import { createRouter, type RouteName, type Router } from './router';

// The dialogs follow the URL: opening one writes it into the URL, and closing one (button,
// backdrop, Escape) removes it again.
function openGame(game: Game): void {
  openDialogUrl('game', game.slug);
}

function notifyAlreadyAuthenticated(): void {
  showSnackbar({ message: ALREADY_AUTHENTICATED_MESSAGE, variant: 'info' });
}

/**
 * Builds the whole page from TypeScript: the static HTML document only contains the script tag.
 */
export function mountApp(root: HTMLElement): void {
  const session: SessionStore = createAppSessionStore();

  // Auth never opens for a signed-in user.
  const openAuth = (mode: AuthMode): void => {
    if (session.check() === undefined) {
      openDialogUrl('auth', mode);
    } else {
      notifyAlreadyAuthenticated();
    }
  };

  const authDialog: AuthDialog = createAuthDialog({
    onModeChange: (mode: AuthMode): void => {
      openDialogUrl('auth', mode);
    },
    authenticate: (request: AuthRequest): Promise<boolean> => didAuthenticate(session, request),
  });
  const gameDialog: GameDialog = createGameDialog({
    session,
    onClose: (): void => {
      closeDialogUrl('game');
    },
  });

  authDialog.element.addEventListener('close', (): void => {
    closeDialogUrl('auth');
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
    onLogout: (): void => {
      void logOut(session);
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
    onLogout: (): void => {
      void logOut(session);
    },
  });

  // The header and the menu follow the session: sign-in, logout and expiry.
  session.subscribe((current: AppSession | undefined): void => {
    header.setSession(current);
    menu.setSession(current);
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

  const syncDialogs: () => void = createDialogSync({
    authDialog,
    gameDialog,
    session,
    onAlreadyAuthenticated: notifyAlreadyAuthenticated,
  });

  // Registered before the router, so every navigation sees an up-to-date session.
  watchSession(session);
  router.start();
  onLocationChange(syncDialogs);
  syncDialogs();
}
