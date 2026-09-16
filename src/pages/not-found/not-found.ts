import './not-found.scss';

export function createNotFoundPage(): HTMLElement {
  const main = document.createElement('main');
  main.className = 'not-found container';

  main.innerHTML = `
    <h1>Page not found</h1>
    <p>The page you're looking for wandered off somewhere cozy.</p>
    <a class="btn btn--primary" href="#/">Back to home</a>
  `;

  return main;
}
