import './text-field.scss';

import eyeIcon from '@/assets/icons/eye.svg?raw';
import eyeOffIcon from '@/assets/icons/eye-off.svg?raw';
import { createElement } from '@/shared/dom/create-element';
import { createIcon } from '@/shared/dom/create-icon';

export interface TextFieldOptions {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  autocomplete: string;
  /**
   * Raw SVG markup of the icon shown inside the field.
   */
  icon: string;
}

function createPasswordToggle(input: HTMLInputElement): HTMLButtonElement {
  const toggle: HTMLButtonElement = createElement('button', {
    className: 'text-field__toggle',
    attributes: { type: 'button', 'aria-label': 'Show password', 'aria-pressed': 'false' },
    children: [createIcon(eyeIcon, 'text-field__toggle-icon')],
  });

  toggle.addEventListener('click', (): void => {
    const isRevealed: boolean = input.type === 'password';

    input.type = isRevealed ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(isRevealed));
    toggle.setAttribute('aria-label', isRevealed ? 'Hide password' : 'Show password');
    toggle.replaceChildren(
      createIcon(isRevealed ? eyeOffIcon : eyeIcon, 'text-field__toggle-icon'),
    );
  });

  return toggle;
}

export function createTextField(options: TextFieldOptions): HTMLElement {
  const label: HTMLLabelElement = createElement('label', {
    className: 'text-field__label',
    text: options.label,
    attributes: { for: options.id },
  });
  const input: HTMLInputElement = createElement('input', {
    className: 'text-field__input',
    attributes: {
      id: options.id,
      name: options.name,
      type: options.type,
      placeholder: options.placeholder,
      autocomplete: options.autocomplete,
      required: '',
    },
  });
  const control: HTMLElement = createElement('div', {
    className: 'text-field__control',
    children: [createIcon(options.icon, 'text-field__icon'), input],
  });

  if (options.type === 'password') {
    control.append(createPasswordToggle(input));
  }

  return createElement('div', { className: 'text-field', children: [label, control] });
}
