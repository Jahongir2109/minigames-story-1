export type RouteName = 'home' | 'library';

export interface Route {
  name: RouteName;
  /**
   * The URL hash of the page, e.g. `#/library`.
   */
  hash: string;
  render: () => HTMLElement;
}

export interface RouterOptions {
  routes: readonly Route[];
  /**
   * The element of the current page; it is replaced on every navigation.
   */
  outlet: HTMLElement;
  onChange: (route: RouteName) => void;
}

export interface Router {
  start: () => void;
}

// Unknown or empty hashes (the first visit, in-page anchors) show the first route.
function findRoute(routes: readonly Route[], hash: string): Route | undefined {
  return routes.find((route: Route): boolean => route.hash === hash) ?? routes[0];
}

/**
 * Minimal client-side router: the pages are switched by rendering them from TypeScript when the
 * URL hash changes, so there is no page reload.
 */
export function createRouter(options: RouterOptions): Router {
  let outlet: HTMLElement = options.outlet;
  let currentRoute: RouteName | undefined;

  const render = (): void => {
    const route: Route | undefined = findRoute(options.routes, location.hash);

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
    addEventListener('hashchange', render);
    render();
  };

  return { start };
}
