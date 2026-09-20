import { HOME_PATH } from './links';

export interface NavigationLink {
  label: string;
  href: string;
  current: boolean;
}

// Until the other pages exist every navigation item leads to the Home page.
export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { label: 'Home', href: HOME_PATH, current: true },
  { label: 'Library', href: HOME_PATH, current: false },
  { label: 'Tournaments', href: HOME_PATH, current: false },
  { label: 'Community', href: HOME_PATH, current: false },
];
