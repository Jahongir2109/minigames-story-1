import './hero.scss';
import { heroGame } from '@/data/games';

export function createHero(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'hero';
  section.id = 'home';
  section.style.setProperty('--hero-image', `url(${heroGame.heroImage})`);

  section.innerHTML = `
    <div class="hero__container container">
      <div class="hero__card">
        <h1 class="hero__title">Take a Short Break &amp; Have Fun</h1>
        <p class="hero__subtitle">
          Discover hundreds of curated casual mini-games. Play instantly in your browser —
          puzzle, match 3, farm, and board classics.
        </p>
        <button type="button" class="btn btn--primary btn--large">Browse Library</button>
      </div>
    </div>
  `;

  return section;
}
