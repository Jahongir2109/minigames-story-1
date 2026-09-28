const NAVIGATE_EVENT: string = 'app:navigate';

export interface NavigateOptions {
  /**
   * Replaces the current history entry instead of adding a new one (e.g. for URL fixes that the
   * Back button must not return to).
   */
  replace?: boolean;
}

function isSameUrl(target: URL): boolean {
  return (
    target.pathname === location.pathname &&
    target.search === location.search &&
    target.hash === location.hash
  );
}

/**
 * Changes the URL with the History API (no page reload) and lets the router render the new state.
 */
export function navigate(url: string, options: NavigateOptions = {}): void {
  const target: URL = new URL(url, location.origin);

  if (isSameUrl(target)) {
    return;
  }

  if (options.replace === true) {
    history.replaceState(null, '', target);
  } else {
    history.pushState(null, '', target);
  }

  dispatchEvent(new Event(NAVIGATE_EVENT));
}

/**
 * Calls the listener after every URL change: `navigate()` calls and the Back / Forward buttons.
 * Returns a function that removes the listener.
 */
export function onLocationChange(listener: () => void): () => void {
  addEventListener('popstate', listener);
  addEventListener(NAVIGATE_EVENT, listener);

  return (): void => {
    removeEventListener('popstate', listener);
    removeEventListener(NAVIGATE_EVENT, listener);
  };
}

// Only plain left clicks on same-origin links of the app are handled in place; new tabs,
// downloads, external links and in-page anchors keep the browser behavior.
function getAppLinkUrl(event: MouseEvent): URL | undefined {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  ) {
    return undefined;
  }

  const anchor: HTMLAnchorElement | null = event.target.closest('a[href]');

  if (
    anchor === null ||
    anchor.hasAttribute('download') ||
    (anchor.target !== '' && anchor.target !== '_self')
  ) {
    return undefined;
  }

  const target: URL = new URL(anchor.href);
  const isInPageAnchor: boolean =
    target.hash !== '' &&
    target.pathname === location.pathname &&
    target.search === location.search;

  return !isInPageAnchor && target.origin === location.origin ? target : undefined;
}

/**
 * Makes every app link (header, menu, footer, cards) navigate without a page reload.
 */
export function interceptLinks(root: HTMLElement): void {
  root.addEventListener('click', (event: MouseEvent): void => {
    const target: URL | undefined = getAppLinkUrl(event);

    if (target === undefined) {
      return;
    }

    event.preventDefault();
    navigate(`${target.pathname}${target.search}${target.hash}`);
  });
}
