import './cta.scss';
import { games } from '@/data/games';

const illustration = games.find((game) => game.slug === 'cozy-solitaire') ?? games[0]!;

export function createCta(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'cta';
  section.id = 'developers';

  section.innerHTML = `
    <div class="cta__container container">
      <img class="cta__illustration" src="${illustration.heroImage}" alt="" />

      <div class="cta__card">
        <h2>Are You a Game Developer?</h2>
        <p>
          Want to see your game on MiniGames? We're always looking for fun, engaging mini
          games to add to our platform. Submit your game and reach thousands of players!
        </p>
        <button type="button" class="btn btn--primary">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
            <path d="M12 4v12m0-12 5 5m-5-5-5 5M5 20h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Submit Form
        </button>
        <p class="cta__hint">or contact us at developers@minigames.com</p>
      </div>
    </div>
  `;

  return section;
}
