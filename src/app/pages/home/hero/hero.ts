import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LIBRARY_PATH } from '@/core/navigation/links';
import { Button } from '@/shared/ui/button/button';

@Component({
  selector: 'app-hero',
  imports: [Button, RouterLink, TranslocoPipe],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <div class="hero__card">
          <h1 class="hero__title" id="hero-title">{{ 'hero.title' | transloco }}</h1>
          <!-- The mobile layout uses a shorter sentence than the tablet and desktop layouts. -->
          <p class="hero__description">
            <span class="hero__text-short">{{ 'hero.short' | transloco }}</span>
            <span class="hero__text-full">{{ 'hero.full' | transloco }}</span>
          </p>
          <a class="hero__button" appButton size="adaptive" [routerLink]="libraryPath">
            {{ 'hero.button' | transloco }}
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  protected readonly libraryPath: string = LIBRARY_PATH;
}
