import './footer.scss';

const YEAR = new Date().getFullYear();

export function createFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'footer';

  footer.innerHTML = `
    <div class="footer__container container">
      <div class="footer__brand">
        <a class="footer__logo" href="#/" aria-label="MiniGames home">
          <span>🎮</span>
          <span>MiniGames</span>
        </a>
        <p>A cozy corner of the internet for slow, happy little games.</p>
      </div>

      <nav class="footer__column" aria-label="Product">
        <h3>Product</h3>
        <ul>
          <li><a href="#games">Games</a></li>
          <li><a href="#leaderboard">Leaderboard</a></li>
          <li><a href="#developers">For developers</a></li>
        </ul>
      </nav>

      <nav class="footer__column" aria-label="Company">
        <h3>Company</h3>
        <ul>
          <li><a href="#">About</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Careers</a></li>
        </ul>
      </nav>

      <nav class="footer__column" aria-label="Legal">
        <h3>Legal</h3>
        <ul>
          <li><a href="#">Privacy policy</a></li>
          <li><a href="#">Terms of service</a></li>
        </ul>
      </nav>
    </div>

    <div class="footer__bottom">
      <p class="container">© ${YEAR} MiniGames. All rights reserved.</p>
    </div>
  `;

  return footer;
}
