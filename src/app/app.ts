import { createHeader, type Header } from '@/components/header/header';
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
    onMenuOpen: pending,
  });

  root.replaceChildren(header.element, createHomePage());
}
