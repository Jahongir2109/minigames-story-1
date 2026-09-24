import './game-dialog.scss';

import closeIcon from '@/assets/icons/close.svg?raw';
import { staticGameDetails } from '@/data/game-details';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import { lockScroll, unlockScroll } from '@/shared/dom/scroll-lock';
import type { GameDetails } from '@/shared/types/game';

import { createGameInfo } from './game-info';

const TITLE_ID: string = 'game-dialog-title';

export interface GameDialog {
  element: HTMLDialogElement;
  open: () => void;
  close: () => void;
}

function createHero(game: GameDetails, onClose: () => void): HTMLElement {
  const image: HTMLImageElement = createElement('img', {
    className: 'game-dialog__hero-image',
    attributes: { src: game.heroImage, alt: `${game.name} key art` },
  });
  const closeButton: HTMLButtonElement = createElement('button', {
    className: 'game-dialog__close',
    attributes: { type: 'button', 'aria-label': 'Close game details' },
    children: [createIcon(closeIcon, 'game-dialog__close-icon')],
  });

  closeButton.addEventListener('click', onClose);

  return createElement('div', { className: 'game-dialog__hero', children: [image, closeButton] });
}

/**
 * Game Details dialog. At this stage it always shows the same static game, whichever card opened
 * it.
 */
export function createGameDialog(): GameDialog {
  const surface: HTMLElement = createElement('div', { className: 'game-dialog__surface' });
  const element: HTMLDialogElement = createElement('dialog', {
    className: 'game-dialog',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [surface],
  });

  const close = (): void => {
    element.close();
  };

  // Rebuilt on every opening, so all interactive state starts from its default.
  const render = (): void => {
    const game: GameDetails = staticGameDetails;
    const body: HTMLElement = createElement('div', {
      className: 'game-dialog__body',
      children: [createGameInfo(game, TITLE_ID)],
    });

    surface.replaceChildren(createHero(game, close), body);
  };

  const open = (): void => {
    if (element.open) {
      return;
    }

    render();
    element.showModal();
    surface.scrollTop = 0;
    lockScroll();
  };

  // Covers the close button, the backdrop, the Escape key and the programmatic close.
  element.addEventListener('close', unlockScroll);

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  element.addEventListener('click', (event: MouseEvent): void => {
    if (event.target === element) {
      close();
    }
  });

  return { element, open, close };
}
