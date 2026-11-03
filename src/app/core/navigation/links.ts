import type { PageName } from './current-page';

// Pages have real URL paths; the Angular router switches between them without a reload.
export const HOME_PATH: string = '/';
export const LIBRARY_PATH: string = '/library';

export const RS_SCHOOL_COURSE_URL: string = 'https://rs.school/courses/short-track';
export const DEVELOPER_GITHUB_URL: string = 'https://github.com/Jahongir2109';
export const DEVELOPER_GITHUB_HANDLE: string = '@Jahongir2109';
export const DEVELOPER_CONTACT_EMAIL: string = 'developers@minigames.com';

export interface NavigationLink {
  /**
   * Translation key of the label.
   */
  label: string;
  path: string;
  /**
   * The page the link opens; links without a page of their own lead to Home and are never
   * marked as current.
   */
  page?: PageName;
}

export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { label: 'nav.home', path: HOME_PATH, page: 'home' },
  { label: 'nav.library', path: LIBRARY_PATH, page: 'library' },
  { label: 'nav.tournaments', path: HOME_PATH },
  { label: 'nav.community', path: HOME_PATH },
];
