// happy-dom does not reflect the ARIA properties (`button.ariaPressed`) to their attributes like
// browsers do, so the app code that uses them is tested against the real attributes.
const ARIA_PROPERTIES: Readonly<Record<string, string>> = {
  ariaBusy: 'aria-busy',
  ariaCurrent: 'aria-current',
  ariaExpanded: 'aria-expanded',
  ariaLabel: 'aria-label',
  ariaPressed: 'aria-pressed',
  ariaSelected: 'aria-selected',
};

for (const [property, attribute] of Object.entries(ARIA_PROPERTIES)) {
  if (Object.getOwnPropertyDescriptor(Element.prototype, property) === undefined) {
    Object.defineProperty(Element.prototype, property, {
      configurable: true,
      get(this: Element): string | null {
        return this.getAttribute(attribute);
      },
      set(this: Element, value: string | null): void {
        this.toggleAttribute(attribute, value !== null);

        if (value !== null) {
          this.setAttribute(attribute, value);
        }
      },
    });
  }
}

// happy-dom has no Popover API, which the Snackbar region uses to stay above modal dialogs.
// The stand-in only marks the element, so tests can see that it was shown or hidden.
Object.assign(HTMLElement.prototype, {
  showPopover(this: HTMLElement): void {
    this.dataset.popoverOpen = 'true';
  },
  hidePopover(this: HTMLElement): void {
    delete this.dataset.popoverOpen;
  },
});
