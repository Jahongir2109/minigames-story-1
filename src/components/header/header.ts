import './header.scss';
import { openAuthDialog } from '@/components/auth-dialog/auth-dialog';

const NAV_LINKS = [
  { href: '#games', label: 'Games' },
  { href: '#leaderboard', label: 'Leaderboard' },
  { href: '#developers', label: 'For developers' },
];

function navMarkup(): string {
  return NAV_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join('');
}

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'header';

  header.innerHTML = `
    <div class="header__bar container">
      <a class="header__logo" href="#/" aria-label="MiniGames home">
        <span class="header__logo-mark">🎮</span>
        <span>MiniGames</span>
      </a>

      <nav class="header__nav" aria-label="Primary">
        ${navMarkup()}
      </nav>

      <div class="header__actions">
        <button type="button" class="btn btn--ghost" data-open-auth="login">Log in</button>
        <button type="button" class="btn btn--primary" data-open-auth="register">Sign up</button>
      </div>

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

    <div class="header__mobile-panel" id="mobile-nav" hidden>
      <nav class="header__mobile-nav" aria-label="Mobile">
        ${navMarkup()}
      </nav>
      <div class="header__mobile-actions">
        <button type="button" class="btn btn--ghost btn--block" data-open-auth="login">Log in</button>
        <button type="button" class="btn btn--primary btn--block" data-open-auth="register">Sign up</button>
      </div>
    </div>
  `;

  const burger = header.querySelector<HTMLButtonElement>('.header__burger');
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
  panel?.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).tagName === 'A') closeMenu();
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
