import './cta.scss';

export function createCta(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'cta';
  section.id = 'developers';

  section.innerHTML = `
    <div class="cta__container container">
      <div class="cta__copy">
        <h2>Made a cozy game of your own?</h2>
        <p>
          Submit it to MiniGames and reach thousands of players looking for their next
          favorite slow-paced adventure.
        </p>
      </div>
      <a class="btn btn--primary" href="mailto:games@minigames.dev">Submit your game</a>
    </div>
  `;

  return section;
}
