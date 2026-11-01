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
