import { createHeader, type Header } from '@/components/header/header';
import { createMobileMenu, type MobileMenu } from '@/components/mobile-menu/mobile-menu';
import { createHomePage } from '@/pages/home/home-page';

function pending(): void {
  // Intentionally empty until the dialog and the mobile menu exist.
}

/**
 * Builds the whole page from TypeScript: the static HTML document only contains the script tag.
 */
export function mountApp(root: HTMLElement): void {
  const header: Header = createHeader({
    onLogin: pending,
    onSignUp: pending,
    onMenuOpen: (): void => {
      menu.open();
    },
  });
  const menu: MobileMenu = createMobileMenu({
    trigger: header.menuButton,
    onLogin: pending,
    onSignUp: pending,
  });

  root.replaceChildren(header.element, createHomePage(), menu.element);
}
