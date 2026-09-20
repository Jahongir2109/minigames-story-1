import './game-developer.scss';

import uploadIcon from '@/assets/icons/upload.svg?raw';
import { createButton } from '@/components/ui/button/button';
import { createElement } from '@/shared/dom/create-element';

const TITLE_ID: string = 'game-developer-title';
const CONTACT_EMAIL: string = 'developers@minigames.com';

export function createGameDeveloper(): HTMLElement {
  const illustration: HTMLImageElement = createElement('img', {
    className: 'game-developer__image',
    attributes: {
      src: '/assets/images/developer-illustration.png',
      alt: 'Illustration of a game developer workspace with a monitor, a gamepad and a desk chair',
      loading: 'lazy',
    },
  });
  const media: HTMLElement = createElement('div', {
    className: 'game-developer__media',
    children: [illustration],
  });

  const title: HTMLHeadingElement = createElement('h2', {
    className: 'game-developer__title',
    text: 'Are You a Game Developer?',
    attributes: { id: TITLE_ID },
  });
  const description: HTMLParagraphElement = createElement('p', {
    className: 'game-developer__description',
    text: "Want to see your game on MiniGames? We're always looking for fun,\nengaging mini games to add to our platform. Submit your game\nand reach thousands of players!",
  });
  const button: HTMLButtonElement = createButton({
    label: 'Submit Form',
    variant: 'primary',
    size: 'adaptive',
    icon: uploadIcon,
    className: 'game-developer__button',
  });
  const contact: HTMLParagraphElement = createElement('p', {
    className: 'game-developer__contact',
    text: `or contact us at ${CONTACT_EMAIL}`,
  });

  const card: HTMLElement = createElement('div', {
    className: 'game-developer__card',
    children: [title, description, button, contact],
  });
  const inner: HTMLElement = createElement('div', {
    className: 'game-developer__inner',
    children: [media, card],
  });

  return createElement('section', {
    className: 'game-developer',
    attributes: { 'aria-labelledby': TITLE_ID },
    children: [inner],
  });
}
