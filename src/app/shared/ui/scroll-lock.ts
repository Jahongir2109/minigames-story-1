import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

const LOCK_CLASS: string = 'scroll-locked';

/**
 * Prevents the page behind an open menu or dialog from scrolling. Locks are counted, so several
 * overlays can be open at the same time.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLock {
  private readonly root: HTMLElement = inject(DOCUMENT).documentElement;
  private count: number = 0;

  lock(): void {
    this.count += 1;
    this.root.classList.add(LOCK_CLASS);
  }

  unlock(): void {
    this.count = Math.max(0, this.count - 1);

    if (this.count === 0) {
      this.root.classList.remove(LOCK_CLASS);
    }
  }
}
