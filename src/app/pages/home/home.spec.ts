import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LanguageStore } from '@/core/i18n/language.store';
import { STORAGE } from '@/core/storage/storage';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { createGame, createPlayer, expectApi, provideTestApi } from '../../../testing/api';
import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { Home } from './home';

function setup(): { fixture: ComponentFixture<Home>; root: HTMLElement } {
  TestBed.configureTestingModule({
    imports: [Home],
    providers: [
      provideRouter([]),
      provideTestApi(),
      provideTestI18n(),
      { provide: STORAGE, useValue: new MemoryStorage() },
    ],
  });

  const fixture: ComponentFixture<Home> = TestBed.createComponent(Home);

  // The API requests stay pending until a test answers them, so the first render is forced.
  TestBed.tick();

  return { fixture, root: fixture.nativeElement as HTMLElement };
}

function text(root: HTMLElement, selector: string): string {
  return root.querySelector(selector)?.textContent.trim() ?? '';
}

describe('Home', () => {
  it('shows skeletons until the featured games and the leaderboard arrive', async () => {
    const { fixture, root } = setup();

    expect(root.querySelector('.carousel__skeleton[aria-busy="true"]')).not.toBeNull();
    expect(root.querySelector('.leaderboard__skeleton[aria-busy="true"]')).not.toBeNull();

    expectApi('/games').flush({ data: [createGame(), createGame({ slug: 'b', name: 'B' })] });
    expectApi('/leaderboard').flush({ data: [createPlayer()] });
    await fixture.whenStable();

    expect(root.querySelectorAll('.carousel__item')).toHaveLength(2);
    expect(root.querySelector('.carousel__controls')).not.toBeNull();
    expect(text(root, '.leaderboard__name')).toBe('Alex_Pro99');
    expect(text(root, '.leaderboard__avatar')).toBe('AP');
  });

  it('opens the details of a slider card through the URL', async () => {
    const { fixture, root } = setup();

    expectApi('/games').flush({ data: [createGame()] });
    expectApi('/leaderboard').flush({ data: [] });
    await fixture.whenStable();

    root.querySelector<HTMLButtonElement>('.game-card__open')?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/?game=tukoni');
  });

  it('shows an error banner and a Snackbar, and loads again on Retry', async () => {
    const { fixture, root } = setup();
    const show: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(Snackbar), 'show');

    expectApi('/games').flush({ error: 'Down' }, { status: 503, statusText: 'Unavailable' });
    expectApi('/leaderboard').flush({ data: [] });
    await fixture.whenStable();

    expect(text(root, 'app-carousel .error-banner__title')).toBe('New games could not be loaded');
    expect(text(root, 'app-carousel .error-banner__message')).toBe(
      'The server ran into a problem. Please try again a bit later.',
    );
    expect(show).toHaveBeenCalledWith({ message: 'carousel.failedNotice', variant: 'error' });
    expect(text(root, 'app-leaderboard .empty-state__title')).toBe('No players yet');

    root.querySelector<HTMLButtonElement>(':scope app-carousel .error-banner__retry')?.click();
    TestBed.tick();
    expectApi('/games').flush({ data: [] });
    await fixture.whenStable();

    expect(text(root, 'app-carousel .empty-state__title')).toBe('No new games yet');
  });

  it('formats the leaderboard for the language of the UI', async () => {
    const { fixture, root } = setup();

    expectApi('/games').flush({ data: [] });
    expectApi('/leaderboard').flush({ data: [createPlayer({ streakDays: 5 })] });
    await TestBed.inject(LanguageStore).use('ru');
    await fixture.whenStable();

    expect(text(root, ':scope tbody .leaderboard__cell--score .leaderboard__full')).toBe('94 250');
    expect(text(root, '.leaderboard__streak .leaderboard__full')).toBe('5 дней');
    expect(text(root, '.leaderboard__title-full')).toBe('Лучшие игроки недели');
    expect(text(root, '.hero__title')).toBe('Сделайте перерыв и развлекитесь');
  });
});
