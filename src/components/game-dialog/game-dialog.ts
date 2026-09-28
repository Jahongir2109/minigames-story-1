import './game-dialog.scss';

import { ApiError, getErrorMessage, isAbortError } from '@/api/client';
import { fetchGameDetails } from '@/api/games';
import closeIcon from '@/assets/icons/close.svg?raw';
import { createEmptyState } from '@/components/ui/empty-state/empty-state';
import { createErrorBanner } from '@/components/ui/error-banner/error-banner';
import { createSkeleton, createSkeletonRegion } from '@/components/ui/skeleton/skeleton';
import { showSnackbar } from '@/components/ui/snackbar/snackbar';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import { lockScroll, unlockScroll } from '@/shared/dom/scroll-lock';
import type { GameDetails } from '@/shared/types/game';

import { createGameComments } from './game-comments';
import { createGameInfo } from './game-info';
import { createGameRecords } from './game-records';

const TITLE_ID: string = 'game-dialog-title';
const SKELETON_LINES: number = 4;

export interface GameDialog {
  element: HTMLDialogElement;
  /**
   * Opens the dialog for the game with this slug and loads its details and comments.
   */
  open: (slug: string) => void;
  close: () => void;
}

function createCloseButton(onClose: () => void): HTMLButtonElement {
  const button: HTMLButtonElement = createElement('button', {
    className: 'game-dialog__close',
    attributes: { type: 'button', 'aria-label': 'Close game details' },
    children: [createIcon(closeIcon, 'game-dialog__close-icon')],
  });

  button.addEventListener('click', onClose);

  return button;
}

function createHero(game: GameDetails, closeButton: HTMLButtonElement): HTMLElement {
  const image: HTMLImageElement = createElement('img', {
    className: 'game-dialog__hero-image',
    attributes: { src: game.heroImage, alt: `${game.name} key art` },
  });

  return createElement('div', { className: 'game-dialog__hero', children: [image, closeButton] });
}

function createSkeletonContent(closeButton: HTMLButtonElement): HTMLElement[] {
  const hero: HTMLElement = createElement('div', {
    className: 'game-dialog__hero',
    children: [createSkeleton('game-dialog__hero-skeleton'), closeButton],
  });
  const lines: HTMLElement[] = [
    createSkeleton('game-dialog__skeleton-title', 'text'),
    ...Array.from({ length: SKELETON_LINES }, (): HTMLElement =>
      createSkeleton('game-dialog__skeleton-line', 'text'),
    ),
    createSkeleton('game-dialog__skeleton-block'),
  ];

  return [
    hero,
    createSkeletonRegion('Loading game details', lines, 'game-dialog__body game-dialog__skeleton'),
  ];
}

// Error and "not found" states have no hero image, so the close button gets its own bar.
function createMessageContent(closeButton: HTMLButtonElement, message: HTMLElement): HTMLElement[] {
  return [
    createElement('div', { className: 'game-dialog__bar', children: [closeButton] }),
    createElement('div', { className: 'game-dialog__body', children: [message] }),
  ];
}

/**
 * Game Details dialog: the details of the opened game and its latest comments come from the API.
 */
export function createGameDialog(): GameDialog {
  const surface: HTMLElement = createElement('div', { className: 'game-dialog__surface' });
  const element: HTMLDialogElement = createElement('dialog', {
    className: 'game-dialog',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [surface],
  });
  let currentSlug: string | undefined;
  // Aborted when the dialog closes or opens another game, so late answers are dropped.
  let session: AbortController = new AbortController();

  const close = (): void => {
    element.close();
  };

  const showGame = (game: GameDetails, slug: string, signal: AbortSignal): void => {
    const body: HTMLElement = createElement('div', {
      className: 'game-dialog__body',
      children: [
        createGameInfo(game, TITLE_ID),
        createGameRecords(game.topRecords),
        createGameComments(slug, signal),
      ],
    });

    surface.replaceChildren(createHero(game, createCloseButton(close)), body);
  };

  const showNotFound = (slug: string): void => {
    const title: HTMLElement = createEmptyState({
      title: 'Game Not Found',
      message: `There is no game "${slug}". The link may be outdated or mistyped.`,
    });

    title.querySelector('.empty-state__title')?.setAttribute('id', TITLE_ID);
    surface.replaceChildren(...createMessageContent(createCloseButton(close), title));
  };

  const load = async (slug: string, signal: AbortSignal): Promise<void> => {
    surface.replaceChildren(...createSkeletonContent(createCloseButton(close)));

    try {
      const game: GameDetails = await fetchGameDetails(slug, { signal });

      showGame(game, slug, signal);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        return;
      }

      if (error instanceof ApiError && error.isNotFound) {
        showNotFound(slug);
        return;
      }

      const banner: HTMLElement = createErrorBanner({
        title: 'Game details could not be loaded',
        message: getErrorMessage(error),
        onRetry: (): void => {
          void load(slug, signal);
        },
      });

      banner.querySelector('.error-banner__title')?.setAttribute('id', TITLE_ID);
      surface.replaceChildren(...createMessageContent(createCloseButton(close), banner));
      showSnackbar({ message: 'Failed to load the game details.', variant: 'error' });
    }
  };

  const open = (slug: string): void => {
    if (slug === currentSlug && element.open) {
      return;
    }

    session.abort();
    session = new AbortController();
    currentSlug = slug;
    void load(slug, session.signal);

    if (!element.open) {
      element.showModal();
      lockScroll();
    }

    surface.scrollTop = 0;
  };

  // Covers the close button, the backdrop, the Escape key and the programmatic close.
  element.addEventListener('close', (): void => {
    session.abort();
    currentSlug = undefined;
    unlockScroll();
  });

  // The dialog box is exactly the surface, so a click on the dialog itself hits the backdrop.
  element.addEventListener('click', (event: MouseEvent): void => {
    if (event.target === element) {
      close();
    }
  });

  return { element, open, close };
}
