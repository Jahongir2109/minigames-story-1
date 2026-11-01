import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/**
 * `localStorage` behind a token, so tests can give every case its own clean storage.
 */
export const STORAGE: InjectionToken<Storage> = new InjectionToken<Storage>('STORAGE', {
  providedIn: 'root',
  factory: (): Storage => {
    const view: (Window & typeof globalThis) | null = inject(DOCUMENT).defaultView;

    if (view === null) {
      throw new Error('STORAGE needs a browser window.');
    }

    return view.localStorage;
  },
});
