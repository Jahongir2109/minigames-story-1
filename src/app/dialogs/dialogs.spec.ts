import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DialogUrl } from '@/core/dialogs/dialog-url';
import { STORAGE } from '@/core/storage/storage';

import { createComment, expectApi, GAME_DETAILS, provideTestApi } from '../../testing/api';
import { MemoryStorage, provideTestI18n } from '../../testing/i18n';
import { DialogHost } from './dialog-host';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Blank {}

async function setup(url: string): Promise<{
  fixture: ComponentFixture<DialogHost>;
  root: HTMLElement;
  router: Router;
  dialogs: DialogUrl;
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      provideTestApi(),
      provideTestI18n(),
      { provide: STORAGE, useValue: new MemoryStorage() },
    ],
  });

  const router: Router = TestBed.inject(Router);

  await router.navigateByUrl(url);

  const fixture: ComponentFixture<DialogHost> = TestBed.createComponent(DialogHost);

  TestBed.tick();

  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    router,
    dialogs: TestBed.inject(DialogUrl),
  };
}

// Lets a resolved request reach the template, which then starts the requests of its children.
async function settle(): Promise<void> {
  for (let step: number = 0; step < 3; step += 1) {
    await new Promise((resolve: (value: unknown) => void) => {
      setTimeout(resolve, 0);
    });
    TestBed.tick();
  }
}

function dialog(root: HTMLElement): HTMLDialogElement {
  const element: HTMLDialogElement | null = root.querySelector('dialog.game-dialog');

  if (element === null) {
    throw new Error('The game dialog is not rendered.');
  }

  return element;
}

describe('DialogUrl', () => {
  it('adds a dialog to the URL of the page and goes back when it closes', async () => {
    const { router, dialogs } = await setup('/library?page=2');

    dialogs.open('game', 'tukoni');
    await vi.waitFor(() => {
      expect(router.url).toBe('/library?page=2&game=tukoni');
    });
    expect(dialogs.game()).toBe('tukoni');

    const back: ReturnType<typeof vi.spyOn> = vi.spyOn(TestBed.inject(Location), 'back');

    dialogs.close('game');

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('replaces a dialog that came from a link instead of going back', async () => {
    const { router, dialogs } = await setup('/?game=tukoni');

    dialogs.close('game');

    await vi.waitFor(() => {
      expect(router.url).toBe('/');
    });
  });

  it('switches one dialog for another in the same history entry, or stacks them', async () => {
    const { router, dialogs } = await setup('/?game=tukoni');

    dialogs.open('auth', 'login', { stack: true });
    await vi.waitFor(() => {
      expect(router.url).toBe('/?game=tukoni&auth=login');
    });

    dialogs.open('auth', 'register');
    await vi.waitFor(() => {
      expect(router.url).toBe('/?game=tukoni&auth=register');
    });

    dialogs.remove('auth');
    await vi.waitFor(() => {
      expect(router.url).toBe('/?game=tukoni');
    });

    dialogs.open('auth', 'login');
    await vi.waitFor(() => {
      expect(router.url).toBe('/?auth=login');
    });
  });
});

describe('Game Details dialog', () => {
  it('shows the game of the URL with its records and latest comments', async () => {
    const { fixture, root } = await setup('/?game=tukoni');

    expect(dialog(root).open).toBe(true);
    expect(root.querySelector('.game-dialog__skeleton[aria-busy="true"]')).not.toBeNull();

    expectApi('/games/tukoni').flush({
      data: {
        ...GAME_DETAILS,
        topRecords: [
          { position: 1, playerName: 'QuietHarbor', score: 123_890, achievedAt: '2026-01-01' },
        ],
      },
    });
    await settle();

    const comments: ReturnType<typeof expectApi> = expectApi('/games/tukoni/comments');

    expect(comments.request.params.toString()).toBe('limit=3&sort=newest');

    comments.flush({ data: [createComment()], meta: { totalComments: 7, returnedCount: 1 } });
    await fixture.whenStable();

    expect(root.querySelector('.game-info__title')?.textContent).toBe('Tukoni: Forest Keepers');
    expect(dialog(root).getAttribute('aria-labelledby')).toBe('game-dialog-title');
    expect(root.querySelector('.game-records__medal')?.textContent).toBe('🥇');
    expect(root.querySelector(':scope .game-records__result span')?.textContent.trim()).toBe(
      '123,890 pts',
    );
    expect(root.querySelector('.game-comments__title')?.textContent.trim()).toBe('Comments (7)');
    expect(root.querySelector('.game-comments__avatar')?.textContent.trim()).toBe('F');
    expect(root.querySelector(':scope .game-info__spec:last-child dd')?.textContent).toBe('Free');
  });

  it('says when the game of a link does not exist', async () => {
    const { fixture, root } = await setup('/?game=missing');

    expectApi('/games/missing').flush({ error: 'Not found' }, { status: 404, statusText: 'NF' });
    await fixture.whenStable();

    expect(root.querySelector('.empty-state__title')?.textContent).toBe('Game Not Found');
    expect(root.querySelector('#game-dialog-title')).not.toBeNull();
  });

  it('removes the game from the URL when the user closes the dialog', async () => {
    const { fixture, root, router } = await setup('/library?game=tukoni');

    expectApi('/games/tukoni').flush({ data: GAME_DETAILS });
    await settle();
    expectApi('/games/tukoni/comments').flush({
      data: [],
      meta: { totalComments: 0, returnedCount: 0 },
    });
    await fixture.whenStable();

    root.querySelector<HTMLButtonElement>('.game-dialog__close')?.click();
    await vi.waitFor(() => {
      expect(router.url).toBe('/library');
    });
    await fixture.whenStable();

    expect(dialog(root).open).toBe(false);
    expect(document.documentElement.classList.contains('scroll-locked')).toBe(false);
  });

  it('keeps the loaded game hidden under Auth and shows it again afterwards', async () => {
    const { fixture, root, dialogs } = await setup('/?game=tukoni');

    expectApi('/games/tukoni').flush({ data: GAME_DETAILS });
    await settle();
    expectApi('/games/tukoni/comments').flush({
      data: [],
      meta: { totalComments: 0, returnedCount: 0 },
    });
    await fixture.whenStable();

    dialogs.open('auth', 'login', { stack: true });
    await vi.waitFor(() => {
      expect(dialog(root).open).toBe(false);
    });

    dialogs.remove('auth');
    await vi.waitFor(() => {
      expect(dialog(root).open).toBe(true);
    });

    // No new request: the game stayed loaded.
    expect(root.querySelector('.game-info__title')?.textContent).toBe('Tukoni: Forest Keepers');
  });
});
