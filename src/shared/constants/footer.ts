import { HOME_PATH } from './links';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: readonly FooterLink[];
}

// Until the other pages exist every footer link leads to the Home page.
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { label: 'Home', href: HOME_PATH },
      { label: 'Library', href: HOME_PATH },
      { label: 'Categories', href: HOME_PATH },
      { label: 'Tournaments', href: HOME_PATH },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'About Us', href: HOME_PATH },
      { label: 'Contact', href: HOME_PATH },
      { label: 'Privacy Policy', href: HOME_PATH },
      { label: 'Terms of Service', href: HOME_PATH },
    ],
  },
];

export interface SocialLink {
  label: string;
  href: string;
  icon: 'share' | 'chat' | 'rss';
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'Share MiniGames', href: HOME_PATH, icon: 'share' },
  { label: 'MiniGames community chat', href: HOME_PATH, icon: 'chat' },
  { label: 'MiniGames news feed', href: HOME_PATH, icon: 'rss' },
];
