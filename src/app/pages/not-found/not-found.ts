import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { HOME_PATH, LIBRARY_PATH } from '@/core/navigation/links';
import { Button } from '@/shared/ui/button/button';

/**
 * Shown for every URL path that has no page; the address stays as typed.
 */
@Component({
  selector: 'app-not-found',
  imports: [Button, RouterLink, TranslocoPipe],
  template: `
    <section class="not-found" aria-labelledby="not-found-title">
      <p class="not-found__code" aria-hidden="true">404</p>
      <h1 class="not-found__title" id="not-found-title">{{ 'notFound.title' | transloco }}</h1>
      <p class="not-found__description">{{ 'notFound.description' | transloco }}</p>
      <div class="not-found__actions">
        <a class="not-found__link" appButton size="adaptive" [routerLink]="homePath">
          {{ 'notFound.home' | transloco }}
        </a>
        <a
          class="not-found__link"
          appButton
          variant="outline"
          size="adaptive"
          [routerLink]="libraryPath"
        >
          {{ 'notFound.library' | transloco }}
        </a>
      </div>
    </section>
  `,
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  protected readonly homePath: string = HOME_PATH;
  protected readonly libraryPath: string = LIBRARY_PATH;
}
