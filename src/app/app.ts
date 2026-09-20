import { type AuthDialog, createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createFooter } from '@/components/footer/footer';
import { createHeader, type Header } from '@/components/header/header';
import { createMobileMenu, type MobileMenu } from '@/components/mobile-menu/mobile-menu';
import { createHomePage } from '@/pages/home/home-page';

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

  root.replaceChildren(
    header.element,
    createHomePage(),
    createFooter(),
    menu.element,
    authDialog.element,
  );
}
