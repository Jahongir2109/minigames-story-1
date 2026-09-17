import './header.scss';
import { openAuthDialog } from '@/components/auth-dialog/auth-dialog';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#games', label: 'Library' },
  { href: '#leaderboard', label: 'Tournaments' },
  { href: '#developers', label: 'Community' },
];

function navMarkup(): string {
  return NAV_LINKS.map(
    (link, index) =>
      `<a href="${link.href}"${index === 0 ? ' class="is-active"' : ''}>${link.label}</a>`,
  ).join('');
}

function logoMarkup(): string {
  return `
    <span class="header__logo-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 3l2.4 5.1 5.6.8-4 3.9 1 5.5L12 15.8 7 18.3l1-5.5-4-3.9 5.6-.8L12 3Z" fill="currentColor" />
      </svg>
    </span>
    <span>MiniGames</span>
  `;
}

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'header';

  header.innerHTML = `
    <div class="header__bar container">
      <a class="header__logo" href="#/" aria-label="MiniGames home">
        ${logoMarkup()}
      </a>

      <nav class="header__nav" aria-label="Primary">
        ${navMarkup()}
      </nav>

      <div class="header__actions">
        <button type="button" class="btn btn--ghost header__login" data-open-auth="login">Log In</button>
        <button type="button" class="btn btn--primary" data-open-auth="register">Sign Up</button>
        <button
          type="button"
          class="header__burger"
          aria-expanded="false"
          aria-controls="mobile-nav"
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <div class="header__mobile-panel" id="mobile-nav" hidden>
      <div class="header__mobile-top container">
        <a class="header__logo" href="#/" aria-label="MiniGames home">
          ${logoMarkup()}
        </a>
        <button type="button" class="header__mobile-close" aria-label="Close menu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <nav class="header__mobile-nav container" aria-label="Mobile">
        ${navMarkup()}
      </nav>
      <div class="header__mobile-actions container">
        <button type="button" class="btn btn--ghost-inverse btn--block" data-open-auth="login">Log In</button>
        <button type="button" class="btn btn--primary btn--block" data-open-auth="register">Sign Up</button>
      </div>
    </div>
  `;

  const burger = header.querySelector<HTMLButtonElement>('.header__burger');
  const closeButton = header.querySelector<HTMLButtonElement>('.header__mobile-close');
  const panel = header.querySelector<HTMLElement>('#mobile-nav');

  function closeMenu(): void {
    if (!burger || !panel) return;
    burger.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function toggleMenu(): void {
    if (!burger || !panel) return;
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    document.body.classList.toggle('no-scroll', !isOpen);
  }

  burger?.addEventListener('click', toggleMenu);
  closeButton?.addEventListener('click', closeMenu);
  panel?.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).tagName === 'A') closeMenu();
  });

  globalThis.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && burger?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  for (const button of header.querySelectorAll<HTMLButtonElement>('[data-open-auth]')) {
    button.addEventListener('click', () => {
      const mode = button.dataset['openAuth'] === 'register' ? 'register' : 'login';
      closeMenu();
      openAuthDialog(mode);
    });
  }

  return header;
}
