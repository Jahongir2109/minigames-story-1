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
