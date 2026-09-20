const LOCK_CLASS: string = 'scroll-locked';

const locks: { count: number } = { count: 0 };

/**
 * Prevents the page behind an open menu or dialog from scrolling.
 * Locks are counted, so several overlays can be open at the same time.
 */
export function lockScroll(): void {
  locks.count += 1;
  document.documentElement.classList.add(LOCK_CLASS);
}

export function unlockScroll(): void {
  locks.count = Math.max(0, locks.count - 1);

  if (locks.count === 0) {
    document.documentElement.classList.remove(LOCK_CLASS);
  }
}
