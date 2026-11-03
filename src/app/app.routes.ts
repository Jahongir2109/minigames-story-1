import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

import type { PageData } from './core/navigation/current-page';

const HOME: PageData = { page: 'home' };
const NOT_FOUND: PageData = { page: 'not-found' };

async function loadHome(): Promise<Type<unknown>> {
  const { Home } = await import('./pages/home/home');

  return Home;
}

async function loadNotFound(): Promise<Type<unknown>> {
  const { NotFound } = await import('./pages/not-found/not-found');

  return NotFound;
}

// Route titles are translation keys (see TranslatedTitleStrategy). The pages are lazy, so each
// one is downloaded the first time it is opened. `/home` is another address of the Home page.
export const routes: Routes = [
  { path: '', title: 'titles.home', data: HOME, loadComponent: loadHome },
  { path: 'home', title: 'titles.home', data: HOME, loadComponent: loadHome },
  { path: '**', title: 'titles.notFound', data: NOT_FOUND, loadComponent: loadNotFound },
];
