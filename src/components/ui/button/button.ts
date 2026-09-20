import './button.scss';

import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

export type ButtonVariant = 'primary' | 'outline' | 'outline-inverse';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonOptions {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit';
  /**
   * Raw SVG markup of an icon shown before the label.
   */
  icon?: string;
  className?: string;
  attributes?: Readonly<Record<string, string>>;
}

export function createButton(options: ButtonOptions): HTMLButtonElement {
  const variant: ButtonVariant = options.variant ?? 'primary';
  const size: ButtonSize = options.size ?? 'medium';
  const extraClass: string = options.className === undefined ? '' : ` ${options.className}`;

  const button: HTMLButtonElement = createElement('button', {
    className: `button button--${variant} button--${size}${extraClass}`,
    attributes: { type: options.type ?? 'button', ...options.attributes },
  });

  if (options.icon !== undefined) {
    button.append(createIcon(options.icon, 'button__icon'));
  }

  button.append(options.label);

  return button;
}
