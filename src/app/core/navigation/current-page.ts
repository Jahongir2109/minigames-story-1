import { DOCUMENT } from '@angular/common';
import { inject, Injectable, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type ActivatedRouteSnapshot,
  type Event,
  NavigationEnd,
  Router,
  type UrlTree,
} from '@angular/router';
import { filter, map, tap } from 'rxjs';

export type PageName = 'home' | 'library' | 'not-found';

/**
 * Route data of every page: the header and the mobile menu mark the link of the open page.
 */
export interface PageData {
  page: PageName;
}

const PAGE_NAMES: readonly PageName[] = ['home', 'library', 'not-found'];

function isPageName(value: unknown): value is PageName {
  return (PAGE_NAMES as readonly unknown[]).includes(value);
}

function readPage(root: ActivatedRouteSnapshot): PageName | undefined {
  let route: ActivatedRouteSnapshot = root;

  while (route.firstChild !== null) {
    route = route.firstChild;
  }

  const page: unknown = route.data['page'];

  return isPageName(page) ? page : undefined;
}

/**
 * The page that is open, and the scroll reset between pages: a new page starts at the top, while
 * a change of the query only (filters, dialogs) keeps the scroll position.
 */
@Injectable({ providedIn: 'root' })
export class CurrentPage {
  private readonly router: Router = inject(Router);
  private readonly window: (Window & typeof globalThis) | null = inject(DOCUMENT).defaultView;
  private lastPath: string | undefined;

  readonly page: Signal<PageName | undefined> = toSignal(
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
      tap(() => {
        this.scrollOnPageChange();
      }),
      map(() => readPage(this.router.routerState.snapshot.root)),
    ),
    { initialValue: undefined },
  );

  private scrollOnPageChange(): void {
    const tree: UrlTree = this.router.parseUrl(this.router.url);
    const path: string = tree.root.children['primary']?.toString() ?? '';

    if (this.lastPath !== undefined && path !== this.lastPath) {
      this.window?.scrollTo({ top: 0 });
    }

    this.lastPath = path;
  }
}
