type RouteRender = () => HTMLElement;

interface Route {
  path: string;
  render: RouteRender;
}

export class Router {
  private readonly routes: Route[] = [];
  private readonly root: HTMLElement;
  private readonly notFound: RouteRender;

  constructor(root: HTMLElement, notFound: RouteRender) {
    this.root = root;
    this.notFound = notFound;
    window.addEventListener('hashchange', () => {
      // Plain in-page anchors (e.g. "#games") are not routes — leave them to
      // the browser's native scroll-into-view and don't touch the outlet.
      if (this.isRoutableHash(window.location.hash)) this.render();
    });
  }

  register(path: string, render: RouteRender): this {
    this.routes.push({ path, render });
    return this;
  }

  start(): void {
    this.render();
  }

  private isRoutableHash(hash: string): boolean {
    const value = hash.replace(/^#/, '');
    return value === '' || value.startsWith('/');
  }

  private currentPath(): string {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/';
  }

  private render(): void {
    const path = this.currentPath();
    const matched = this.routes.find((route) => route.path === path);
    const view = matched ? matched.render() : this.notFound();

    this.root.replaceChildren(view);
    window.scrollTo({ top: 0 });
  }
}
