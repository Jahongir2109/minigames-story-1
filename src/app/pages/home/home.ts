import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import type { Game } from '@/core/api/models';
import { DialogUrl } from '@/core/dialogs/dialog-url';

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
  private readonly dialogs: DialogUrl = inject(DialogUrl);

  protected openGame(game: Game): void {
    this.dialogs.open('game', game.slug);
  }
}
