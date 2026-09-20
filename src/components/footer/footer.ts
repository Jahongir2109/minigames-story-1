import './footer.scss';

import chatIcon from '@/assets/icons/chat.svg?raw';
import codeIcon from '@/assets/icons/code.svg?raw';
import rssIcon from '@/assets/icons/rss.svg?raw';
import shareIcon from '@/assets/icons/share.svg?raw';
import { APP_NAME, createBrand } from '@/components/brand/brand';
import {
  FOOTER_COLUMNS,
  type FooterColumn,
  type FooterLink,
  SOCIAL_LINKS,
  type SocialLink,
} from '@/shared/constants/footer';
import {
  DEVELOPER_GITHUB_HANDLE,
  DEVELOPER_GITHUB_URL,
  RS_SCHOOL_COURSE_URL,
} from '@/shared/constants/links';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

const SOCIAL_ICONS: Readonly<Record<SocialLink['icon'], string>> = {
  share: shareIcon,
  chat: chatIcon,
  rss: rssIcon,
};

const EXTERNAL_LINK_ATTRIBUTES: Readonly<Record<string, string>> = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

function createColumn(column: FooterColumn): HTMLElement {
  const headingId: string = `footer-${column.id}`;
  const heading: HTMLHeadingElement = createElement('h2', {
    className: 'footer__heading',
    text: column.title,
    attributes: { id: headingId },
  });
  const items: HTMLLIElement[] = column.links.map((link: FooterLink): HTMLLIElement => {
    const anchor: HTMLAnchorElement = createElement('a', {
      className: 'footer__link',
      text: link.label,
      attributes: { href: link.href },
    });

    return createElement('li', { children: [anchor] });
  });
  const list: HTMLUListElement = createElement('ul', {
    className: 'footer__list',
    children: items,
  });

  return createElement('nav', {
    className: 'footer__column',
    attributes: { 'aria-labelledby': headingId },
    children: [heading, list],
  });
}

function createCommunity(): HTMLElement {
  const heading: HTMLHeadingElement = createElement('h2', {
    className: 'footer__heading',
    text: 'Community',
    attributes: { id: 'footer-community' },
  });
  const items: HTMLLIElement[] = SOCIAL_LINKS.map((social: SocialLink): HTMLLIElement => {
    const anchor: HTMLAnchorElement = createElement('a', {
      className: 'footer__social',
      attributes: { href: social.href, 'aria-label': social.label },
      children: [createIcon(SOCIAL_ICONS[social.icon], 'footer__social-icon')],
    });

    return createElement('li', { children: [anchor] });
  });
  const list: HTMLUListElement = createElement('ul', {
    className: 'footer__socials',
    children: items,
  });

  return createElement('div', {
    className: 'footer__column footer__column--community',
    children: [heading, list],
  });
}

function createBottom(): HTMLElement {
  const copyright: HTMLParagraphElement = createElement('p', {
    className: 'footer__copyright',
    text: `© ${String(new Date().getFullYear())} ${APP_NAME}. All rights reserved.`,
  });
  const schoolLink: HTMLAnchorElement = createElement('a', {
    className: 'footer__credit',
    attributes: { href: RS_SCHOOL_COURSE_URL, ...EXTERNAL_LINK_ATTRIBUTES },
    children: [
      createElement('span', {
        className: 'footer__badge footer__badge--school',
        text: 'RS',
        attributes: { 'aria-hidden': 'true' },
      }),
      'RS School',
    ],
  });
  const githubLink: HTMLAnchorElement = createElement('a', {
    className: 'footer__credit',
    attributes: { href: DEVELOPER_GITHUB_URL, ...EXTERNAL_LINK_ATTRIBUTES },
    children: [
      createElement('span', {
        className: 'footer__badge footer__badge--github',
        attributes: { 'aria-hidden': 'true' },
        children: [createIcon(codeIcon, 'footer__badge-icon')],
      }),
      DEVELOPER_GITHUB_HANDLE,
    ],
  });
  const note: HTMLParagraphElement = createElement('p', {
    className: 'footer__note',
    text: 'Designed with love',
  });

  return createElement('div', {
    className: 'footer__bottom',
    children: [copyright, schoolLink, githubLink, note],
  });
}

export function createFooter(): HTMLElement {
  const description: HTMLParagraphElement = createElement('p', {
    className: 'footer__description',
    text: 'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.',
  });
  const about: HTMLElement = createElement('div', {
    className: 'footer__about',
    children: [createBrand({ inverse: true }), description],
  });
  const links: HTMLElement = createElement('div', {
    className: 'footer__links',
    children: [
      ...FOOTER_COLUMNS.map((column: FooterColumn): HTMLElement => createColumn(column)),
      createCommunity(),
    ],
  });
  const top: HTMLElement = createElement('div', {
    className: 'footer__top',
    children: [about, links],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'footer__inner',
    children: [top, createBottom()],
  });

  return createElement('footer', { className: 'footer', children: [inner] });
}
