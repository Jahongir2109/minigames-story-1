import './footer.scss';

const YEAR = new Date().getFullYear();

const SOCIAL_ICONS = [
  '<path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0-3 3v2H9v3h3v7h3v-7h2.5l.5-3H15V7a1 1 0 0 1 1-1h2V3.06A3 3 0 0 0 18 8Z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  '<path d="M4 4h16v12H8l-4 4V4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M6 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" fill="none" stroke="currentColor" stroke-width="1.6"/>',
];

function logoMarkup(): string {
  return `
    <span class="footer__logo-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 3l2.4 5.1 5.6.8-4 3.9 1 5.5L12 15.8 7 18.3l1-5.5-4-3.9 5.6-.8L12 3Z" fill="currentColor" />
      </svg>
    </span>
    <span>MiniGames</span>
  `;
}

export function createFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'footer';

  footer.innerHTML = `
    <div class="footer__container container">
      <div class="footer__brand">
        <a class="footer__logo" href="#/" aria-label="MiniGames home">${logoMarkup()}</a>
        <p>
          Take a short break and have fun. Hundreds of curated casual mini-games right in
          your web browser. No download required.
        </p>
      </div>

      <nav class="footer__column" aria-label="Explore">
        <h3>Explore</h3>
        <ul>
          <li><a href="#/">Home</a></li>
          <li><a href="#games">Library</a></li>
          <li><a href="#games">Categories</a></li>
          <li><a href="#leaderboard">Tournaments</a></li>
        </ul>
      </nav>

      <nav class="footer__column" aria-label="Company">
        <h3>Company</h3>
        <ul>
          <li><a href="#/">About Us</a></li>
          <li><a href="#/">Contact</a></li>
          <li><a href="#/">Privacy Policy</a></li>
          <li><a href="#/">Terms of Service</a></li>
        </ul>
      </nav>

      <div class="footer__column">
        <h3>Community</h3>
        <div class="footer__social">
          ${SOCIAL_ICONS.map(
            (icon) => `
              <a href="#/" class="footer__social-link" aria-label="MiniGames on social media">
                <svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>
              </a>
            `,
          ).join('')}
        </div>
      </div>
    </div>

    <div class="footer__bottom">
      <div class="footer__bottom-inner container">
        <p>© ${YEAR} MiniGames. All rights reserved.</p>
        <a class="footer__badge" href="https://rs.school/courses/short-track" target="_blank" rel="noopener noreferrer">🎓 RS School</a>
        <a href="https://github.com/Jahongir2109" target="_blank" rel="noopener noreferrer">@Jahongir2109</a>
        <span>Designed with love</span>
      </div>
    </div>
  `;

  return footer;
}
