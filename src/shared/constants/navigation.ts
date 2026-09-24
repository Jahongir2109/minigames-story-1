import type { RouteName } from '@/app/router';

import { HOME_PATH, LIBRARY_PATH } from './links';

export interface NavigationLink {
  label: string;
  href: string;
  /**
   * The page the link opens; links without a page of their own lead to Home and are never
   * marked as current.
   */
  route?: RouteName;
}

export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { label: 'Home', href: HOME_PATH, route: 'home' },
  { label: 'Library', href: LIBRARY_PATH, route: 'library' },
  { label: 'Tournaments', href: HOME_PATH },
  { label: 'Community', href: HOME_PATH },
];

/**
 * Marks the navigation links of the current page with `aria-current` (used by the header and the
 * mobile menu).
 */
export function markCurrentLinks(links: readonly HTMLAnchorElement[], route: RouteName): void {
  for (const link of links) {
    // `null` removes the attribute.
    link.ariaCurrent = link.dataset.route === route ? 'page' : null;
  }
}
