import { createHeader } from '@/components/header/header';
import { createFooter } from '@/components/footer/footer';
import { createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createHomePage } from '@/pages/home/home';
import { createNotFoundPage } from '@/pages/not-found/not-found';
import { Router } from '@/router/router';

export function createApp(root: HTMLElement): void {
  const outlet = document.createElement('div');
  outlet.id = 'outlet';

  root.append(createHeader(), outlet, createFooter(), createAuthDialog());

  const router = new Router(outlet, createNotFoundPage);
  router.register('/', createHomePage);
  router.start();
}
