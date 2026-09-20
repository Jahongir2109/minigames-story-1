import { createHomePage } from '@/pages/home/home-page';

/**
 * Builds the whole page from TypeScript: the static HTML document only contains the script tag.
 */
export function mountApp(root: HTMLElement): void {
  root.replaceChildren(createHomePage());
}
