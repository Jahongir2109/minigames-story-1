import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { APP_NAME } from '@/core/i18n/translated-title.strategy';
import {
  DEVELOPER_GITHUB_HANDLE,
  DEVELOPER_GITHUB_URL,
  HOME_PATH,
  LIBRARY_PATH,
  RS_SCHOOL_COURSE_URL,
} from '@/core/navigation/links';
import { Icon } from '@/shared/ui/icon/icon';
import type { IconName } from '@/shared/ui/icon/icons';

import { Brand } from '../brand/brand';

interface FooterLink {
  /**
   * Translation key of the label.
   */
  label: string;
  path: string;
}

interface FooterColumn {
  id: string;
  title: string;
  links: readonly FooterLink[];
}

interface SocialLink {
  label: string;
  path: string;
  icon: IconName;
}

// Links to pages that do not exist yet lead to the Home page.
const COLUMNS: readonly FooterColumn[] = [
  {
    id: 'explore',
    title: 'footer.explore',
    links: [
      { label: 'nav.home', path: HOME_PATH },
      { label: 'nav.library', path: LIBRARY_PATH },
      { label: 'footer.categories', path: HOME_PATH },
      { label: 'nav.tournaments', path: HOME_PATH },
    ],
  },
  {
    id: 'company',
    title: 'footer.company',
    links: [
      { label: 'footer.about', path: HOME_PATH },
      { label: 'footer.contact', path: HOME_PATH },
      { label: 'footer.privacy', path: HOME_PATH },
      { label: 'footer.terms', path: HOME_PATH },
    ],
  },
];

const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'footer.share', path: HOME_PATH, icon: 'share' },
  { label: 'footer.chat', path: HOME_PATH, icon: 'chat' },
  { label: 'footer.news', path: HOME_PATH, icon: 'rss' },
];

@Component({
  selector: 'app-footer',
  imports: [Brand, Icon, RouterLink, TranslocoPipe],
  template: `
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__top">
          <div class="footer__about">
            <app-brand [inverse]="true" />
            <p class="footer__description">{{ 'footer.description' | transloco }}</p>
          </div>
          <div class="footer__links">
            @for (column of columns; track column.id) {
              <nav class="footer__column" [attr.aria-labelledby]="'footer-' + column.id">
                <h2 class="footer__heading" [id]="'footer-' + column.id">
                  {{ column.title | transloco }}
                </h2>
                <ul class="footer__list">
                  @for (link of column.links; track link.label) {
                    <li>
                      <a class="footer__link" [routerLink]="link.path">{{
                        link.label | transloco
                      }}</a>
                    </li>
                  }
                </ul>
              </nav>
            }
            <div class="footer__column footer__column--community">
              <h2 class="footer__heading" id="footer-community">
                {{ 'nav.community' | transloco }}
              </h2>
              <ul class="footer__socials">
                @for (social of socials; track social.icon) {
                  <li>
                    <a
                      class="footer__social"
                      [routerLink]="social.path"
                      [attr.aria-label]="social.label | transloco: { name: appName }"
                    >
                      <app-icon class="footer__social-icon" [name]="social.icon" />
                    </a>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
        <div class="footer__bottom">
          <p class="footer__copyright">
            {{ 'footer.copyright' | transloco: { year: year, name: appName } }}
          </p>
          <a class="footer__credit" [href]="schoolUrl" target="_blank" rel="noopener noreferrer">
            <span class="footer__badge footer__badge--school" aria-hidden="true">RS</span>
            RS School
          </a>
          <a class="footer__credit" [href]="githubUrl" target="_blank" rel="noopener noreferrer">
            <span class="footer__badge footer__badge--github" aria-hidden="true">
              <app-icon class="footer__badge-icon" name="code" />
            </span>
            {{ githubHandle }}
          </a>
          <p class="footer__note">{{ 'footer.note' | transloco }}</p>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly columns: readonly FooterColumn[] = COLUMNS;
  protected readonly socials: readonly SocialLink[] = SOCIAL_LINKS;
  protected readonly appName: string = APP_NAME;
  protected readonly year: number = new Date().getFullYear();
  protected readonly schoolUrl: string = RS_SCHOOL_COURSE_URL;
  protected readonly githubUrl: string = DEVELOPER_GITHUB_URL;
  protected readonly githubHandle: string = DEVELOPER_GITHUB_HANDLE;
}
