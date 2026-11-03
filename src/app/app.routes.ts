import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';

import type { PageData } from './core/navigation/current-page';

const NOT_FOUND: PageData = { page: 'not-found' };

// Route titles are translation keys (see TranslatedTitleStrategy). The pages are lazy, so each
// one is downloaded the first time it is opened.
export const routes: Routes = [
  {
    path: '**',
    title: 'titles.notFound',
    data: NOT_FOUND,
    loadComponent: async (): Promise<Type<unknown>> => {
      const { NotFound } = await import('./pages/not-found/not-found');

      return NotFound;
    },
  },
];
