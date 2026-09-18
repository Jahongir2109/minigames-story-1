import './carousel.scss';
import { games } from '@/data/games';

function cardMarkup(game: (typeof games)[number]): string {
  return `
    <li class="carousel__card">
      <img src="${game.cardImage}" alt="${game.name}" loading="lazy" width="280" height="360" />
      <div class="carousel__card-overlay">
        <p class="carousel__card-title">${game.name}</p>
        <div class="carousel__card-meta">
          <span class="carousel__card-rating">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.4 5.1 5.6.8-4 3.9 1 5.5L12 15.8 7 18.3l1-5.5-4-3.9 5.6-.8L12 3Z" fill="currentColor" /></svg>
            ${game.rating}
          </span>
          <span class="carousel__card-likes">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.35-9.5-8.8C.86 8.6 2.1 5 5.6 5c2 0 3.4 1.1 4.4 2.7C11 6.1 12.4 5 14.4 5c3.5 0 4.74 3.6 3.1 7.2C19 16.65 12 21 12 21Z" fill="currentColor" /></svg>
            ${game.likes}
          </span>
        </div>
      </div>
    </li>
  `;
}

export function createCarousel(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'carousel';
  section.id = 'games';
  section.setAttribute('aria-label', 'New games');

  section.innerHTML = `
    <div class="carousel__container container">
      <div class="carousel__header">
        <h2><span class="carousel__accent" aria-hidden="true"></span>New Games</h2>
        <div class="carousel__controls">
          <button type="button" class="carousel__control carousel__control--prev" data-dir="prev" aria-label="Scroll to previous games">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" class="carousel__control carousel__control--next" data-dir="next" aria-label="Scroll to next games">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <ul class="carousel__track" role="list">
        ${games.map((game) => cardMarkup(game)).join('')}
      </ul>

      <div class="carousel__indicators" aria-hidden="true">
        ${games.map((_, index) => `<span class="carousel__indicator${index === 0 ? ' is-active' : ''}"></span>`).join('')}
      </div>
    </div>
  `;

  // Navigation arrows and indicators are static at this stage — slide
  // switching interactivity is implemented in a later task.
  for (const button of section.querySelectorAll<HTMLButtonElement>('[data-dir]')) {
    button.disabled = true;
  }

  return section;
}
