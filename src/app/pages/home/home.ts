import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import type { Game } from '@/core/api/models';

import { Carousel } from './carousel/carousel';
import { GameDeveloper } from './game-developer/game-developer';
import { Hero } from './hero/hero';
import { Leaderboard } from './leaderboard/leaderboard';

@Component({
  selector: 'app-home',
  imports: [Carousel, GameDeveloper, Hero, Leaderboard],
  template: `
    <app-hero />
    <app-carousel (openGame)="openGame($event)" />
    <app-leaderboard />
    <app-game-developer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router: Router = inject(Router);

  /**
   * The Game Details dialog follows the URL (`?game=<slug>`).
   */
  protected openGame(game: Game): void {
    void this.router.navigate([], {
      queryParams: { game: game.slug },
      queryParamsHandling: 'merge',
    });
  }
}
