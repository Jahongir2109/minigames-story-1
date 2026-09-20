/**
 * Turns a bundled SVG file (imported with the `?raw` suffix) into an SVG element.
 */
export function createIcon(markup: string, className?: string): SVGElement {
  const template: HTMLTemplateElement = document.createElement('template');
  template.innerHTML = markup.trim();

  const icon: Element | null = template.content.firstElementChild;

  if (!(icon instanceof SVGElement)) {
    throw new TypeError('Icon markup must contain an <svg> element.');
  }

  if (className !== undefined) {
    icon.classList.add(className);
  }

  return icon;
}
