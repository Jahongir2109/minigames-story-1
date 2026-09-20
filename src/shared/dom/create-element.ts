export interface ElementOptions {
  className?: string;
  text?: string;
  attributes?: Readonly<Record<string, string>>;
  children?: readonly (Node | string)[];
}

/**
 * Creates a typed DOM element. All application markup is generated with this helper,
 * so the static HTML document keeps an empty body (SPA).
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
): HTMLElementTagNameMap[K] {
  const element: HTMLElementTagNameMap[K] = document.createElement(tag);

  if (options.className !== undefined) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attributes !== undefined) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }

  if (options.children !== undefined) {
    element.append(...options.children);
  }

  return element;
}
