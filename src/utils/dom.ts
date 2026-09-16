type ElementChild = Node | string | null | undefined | false;

interface ElementOptions {
  className?: string;
  attrs?: Record<string, string>;
  text?: string;
  children?: ElementChild[];
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (options.className) {
    node.className = options.className;
  }

  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      node.setAttribute(key, value);
    }
  }

  if (options.text !== undefined) {
    node.textContent = options.text;
  }

  if (options.children) {
    for (const child of options.children) {
      if (!child) continue;
      node.append(child);
    }
  }

  return node;
}

export function svgIcon(paths: string, viewBox = '0 0 24 24'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths;
  return svg;
}
