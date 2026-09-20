import './brand.scss';

import logoIcon from '@/assets/icons/logo.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';
import { HOME_PATH } from '@/shared/constants/links';

export const APP_NAME: string = 'MiniGames';

export interface BrandOptions {
  /**
   * Light text for dark backgrounds (footer, mobile menu).
   */
  inverse?: boolean;
}

export function createBrand(options: BrandOptions = {}): HTMLAnchorElement {
  const modifier: string = options.inverse === true ? ' brand--inverse' : '';

  return createElement('a', {
    className: `brand${modifier}`,
    attributes: { href: HOME_PATH },
    children: [
      createIcon(logoIcon, 'brand__logo'),
      createElement('span', { className: 'brand__name', text: APP_NAME }),
    ],
  });
}
