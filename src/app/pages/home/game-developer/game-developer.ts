import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { DEVELOPER_CONTACT_EMAIL } from '@/core/navigation/links';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';

@Component({
  selector: 'app-game-developer',
  imports: [Button, Icon, TranslocoPipe],
  template: `
    <section class="game-developer" aria-labelledby="game-developer-title">
      <div class="game-developer__inner">
        <div class="game-developer__media">
          <img
            class="game-developer__image"
            src="/assets/images/developer-illustration.png"
            loading="lazy"
            [alt]="'gameDeveloper.imageAlt' | transloco"
          />
        </div>
        <div class="game-developer__card">
          <h2 class="game-developer__title" id="game-developer-title">
            {{ 'gameDeveloper.title' | transloco }}
          </h2>
          <p class="game-developer__description">{{ 'gameDeveloper.description' | transloco }}</p>
          <button class="game-developer__button" type="button" appButton size="adaptive">
            <app-icon class="button__icon" name="upload" />
            {{ 'gameDeveloper.submit' | transloco }}
          </button>
          <p class="game-developer__contact">
            {{ 'gameDeveloper.contact' | transloco: { email: contactEmail } }}
          </p>
        </div>
      </div>
    </section>
  `,
  styleUrl: './game-developer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDeveloper {
  protected readonly contactEmail: string = DEVELOPER_CONTACT_EMAIL;
}
