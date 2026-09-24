import { type AuthDialog, createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createFooter } from '@/components/footer/footer';
import { createHeader, type Header } from '@/components/header/header';
import { createMobileMenu, type MobileMenu } from '@/components/mobile-menu/mobile-menu';
import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import { createElement } from '@/shared/dom/create-element';
import { HOME_PATH, LIBRARY_PATH } from '@/shared/constants/links';

import { createRouter, type RouteName, type Router } from './router';

/**
 * Builds the whole page from TypeScript: the static HTML document only contains the script tag.
 */
export function mountApp(root: HTMLElement): void {
  const authDialog: AuthDialog = createAuthDialog();

  const header: Header = createHeader({
    onLogin: (): void => {
      authDialog.open('login');
    },
    onSignUp: (): void => {
      authDialog.open('register');
    },
    onMenuOpen: (): void => {
      menu.open();
    },
  });
  // The menu closes itself before it asks for the dialog.
  const menu: MobileMenu = createMobileMenu({
    trigger: header.menuButton,
    onLogin: (): void => {
      authDialog.open('login');
    },
    onSignUp: (): void => {
      authDialog.open('register');
    },
  });

  // Replaced by the page of the current route as soon as the router starts.
  const outlet: HTMLElement = createElement('main');

  root.replaceChildren(header.element, outlet, createFooter(), menu.element, authDialog.element);

  const router: Router = createRouter({
    outlet,
    routes: [
      { name: 'home', hash: HOME_PATH, render: createHomePage },
      { name: 'library', hash: LIBRARY_PATH, render: createLibraryPage },
    ],
    onChange: (route: RouteName): void => {
      header.setCurrentRoute(route);
      menu.setCurrentRoute(route);
    },
  });

  router.start();
}
