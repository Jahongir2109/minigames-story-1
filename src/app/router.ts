import { interceptLinks, onLocationChange } from './navigation';

export type RouteName = 'home' | 'library' | 'not-found';

export interface Route {
  name: RouteName;
  /**
   * The URL path of the page, e.g. `/library`.
   */
  path: string;
  /**
   * Other paths that open the same page, e.g. `/home` for `/`.
   */
  aliases?: readonly string[];
  render: () => HTMLElement;
}

export interface RouterOptions {
  routes: readonly Route[];
  /**
   * Renders the page of every path that has no route.
   */
  notFound: () => HTMLElement;
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

function findRoute(routes: readonly Route[], path: string): Route | undefined {
  return routes.find(
    (route: Route): boolean => route.path === path || route.aliases?.includes(path) === true,
  );
}

/**
 * Client-side router on the History API: the pages are switched by rendering them from TypeScript
 * when the URL path changes, so there is no page reload and every page has its own address.
 */
export function createRouter(options: RouterOptions): Router {
  let outlet: HTMLElement = options.outlet;
  let currentPath: string | undefined;

  // A change of the query string only (filters, dialogs) keeps the page; the page follows the
  // URL itself. Different unknown paths still re-render the 404 page.
  const render = (): void => {
    const path: string = normalizePath(location.pathname);

    if (path === currentPath) {
      return;
    }

    const route: Route | undefined = findRoute(options.routes, path);
    const page: HTMLElement = route === undefined ? options.notFound() : route.render();

    outlet.replaceWith(page);
    outlet = page;
    currentPath = path;
    scrollTo({ top: 0 });
    options.onChange(route?.name ?? 'not-found');
  };

  const start = (): void => {
    interceptLinks(options.root);
    onLocationChange(render);
    render();
  };

  return { start };
}
