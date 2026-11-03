// jsdom has no Popover API, which the Snackbar region uses to stay above modal dialogs, and no
// <dialog> methods. The stand-ins only mark the element, so tests can see what was shown.
Object.assign(HTMLElement.prototype, {
  showPopover(this: HTMLElement): void {
    this.dataset['popoverOpen'] = 'true';
  },
  hidePopover(this: HTMLElement): void {
    delete this.dataset['popoverOpen'];
  },
});

// jsdom has no media queries: every query is reported as not matching (the mobile layout).
// Tests that need another width replace window.matchMedia themselves.
if (typeof matchMedia !== 'function') {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      Object.assign(new EventTarget(), {
        matches: false,
        media: query,
        onchange: null,
        addListener: (): void => undefined,
        removeListener: (): void => undefined,
      }) as unknown as MediaQueryList,
  });
}

Object.assign(HTMLDialogElement.prototype, {
  showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  },
  close(this: HTMLDialogElement): void {
    if (!this.hasAttribute('open')) {
      return;
    }

    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  },
});
