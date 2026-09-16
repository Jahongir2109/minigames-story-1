import './carousel.scss';
import { games } from '@/data/games';

function cardMarkup(game: (typeof games)[number]): string {
  return `
    <li class="carousel__card">
      <img src="${game.cardImage}" alt="${game.name}" loading="lazy" width="280" height="360" />
      <p class="carousel__card-title">${game.name}</p>
    </li>
  `;
}

export function createCarousel(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'carousel';
  section.id = 'games';
  section.setAttribute('aria-label', 'Popular games');

  section.innerHTML = `
    <div class="carousel__container container">
      <div class="carousel__header">
        <h2>Popular games</h2>
        <div class="carousel__controls">
          <button type="button" class="carousel__control" data-dir="prev" aria-label="Scroll to previous games">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" class="carousel__control" data-dir="next" aria-label="Scroll to next games">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <ul class="carousel__track" role="list">
        ${games.map(cardMarkup).join('')}
      </ul>
    </div>
  `;

  const track = section.querySelector<HTMLUListElement>('.carousel__track');
  const [prevButton, nextButton] = section.querySelectorAll<HTMLButtonElement>('[data-dir]');

  function scrollByCards(direction: 1 | -1): void {
    const card = track?.querySelector<HTMLLIElement>('.carousel__card');
    if (!track || !card) return;
    const amount = card.getBoundingClientRect().width + 20;
    track.scrollBy({ left: amount * direction });
  }

  prevButton?.addEventListener('click', () => scrollByCards(-1));
  nextButton?.addEventListener('click', () => scrollByCards(1));

  return section;
}
