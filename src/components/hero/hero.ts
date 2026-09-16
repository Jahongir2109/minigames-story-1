import './hero.scss';
import { heroGame } from '@/data/games';

export function createHero(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'hero';
  section.id = 'home';

  section.innerHTML = `
    <div class="hero__container container">
      <div class="hero__content">
        <p class="hero__eyebrow">New this week</p>
        <h1 class="hero__title">Cozy games for slow, happy days</h1>
        <p class="hero__subtitle">
          Discover hand-picked indie games about tending gardens, running tiny cafés and
          solving gentle little mysteries. No timers, no pressure — just cozy fun.
        </p>
        <div class="hero__cta">
          <a class="btn btn--primary" href="#games">Browse games</a>
          <a class="btn btn--ghost" href="#developers">Submit your game</a>
        </div>
      </div>

      <figure class="hero__media">
        <img src="${heroGame.heroImage}" alt="Screenshot from ${heroGame.name}" width="640" height="480" />
        <figcaption class="hero__media-badge">${heroGame.name}</figcaption>
      </figure>
    </div>
  `;

  return section;
}
