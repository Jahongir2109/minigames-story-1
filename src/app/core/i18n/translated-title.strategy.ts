import { effect, inject, Injectable, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageStore } from './language.store';

export const APP_NAME: string = 'MiniGames';

/**
 * Route titles are translation keys (`title: 'home.pageTitle'`). The document title is built
 * from the active one and is translated again whenever the language changes.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title: Title = inject(Title);
  private readonly transloco: TranslocoService = inject(TranslocoService);
  private readonly languages: LanguageStore = inject(LanguageStore);
  private key: string | undefined;

  constructor() {
    super();

    effect(() => {
      this.languages.language();
      untracked(() => {
        this.render();
      });
    });
  }

  private render(): void {
    const page: string | undefined =
      this.key === undefined ? undefined : this.transloco.translate(this.key);

    this.title.setTitle(page === undefined ? APP_NAME : `${page} — ${APP_NAME}`);
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot);
    this.render();
  }
}
