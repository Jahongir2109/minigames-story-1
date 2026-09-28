import { interceptLinks, onLocationChange } from './navigation';

export type RouteName = 'home' | 'library';

export interface Route {
  name: RouteName;
  /**
   * The URL path of the page, e.g. `/library`.
   */
  path: string;
  render: () => HTMLElement;
}

export interface RouterOptions {
  routes: readonly Route[];
  /**
   * The element of the current page; it is replaced on every navigation.
   */
  outlet: HTMLElement;
  /**
   * The element whose app links are handled by the router.
   */
  root: HTMLElement;
  onChange: (route: RouteName) => void;
}

export interface Router {
  start: () => void;
}

// `/library/` and `/library` are the same page.
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

// Unknown paths show the first route.
function findRoute(routes: readonly Route[], path: string): Route | undefined {
  const normalized: string = normalizePath(path);

  return routes.find((route: Route): boolean => route.path === normalized) ?? routes[0];
}

/**
 * Client-side router on the History API: the pages are switched by rendering them from TypeScript
 * when the URL path changes, so there is no page reload and every page has its own address.
 */
export function createRouter(options: RouterOptions): Router {
  let outlet: HTMLElement = options.outlet;
  let currentRoute: RouteName | undefined;

  // A change of the query string only (filters, dialogs) keeps the page; the page follows the
  // URL itself.
  const render = (): void => {
    const route: Route | undefined = findRoute(options.routes, location.pathname);

    if (route === undefined || route.name === currentRoute) {
      return;
    }

    const page: HTMLElement = route.render();

    outlet.replaceWith(page);
    outlet = page;
    currentRoute = route.name;
    scrollTo({ top: 0 });
    options.onChange(route.name);
  };

  const start = (): void => {
    interceptLinks(options.root);
    onLocationChange(render);
    render();
  };

  return { start };
}
