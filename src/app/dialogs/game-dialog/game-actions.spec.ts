import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { MockInstance } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Authenticator } from '@/core/auth/authenticator';
import { SESSION_STORAGE_KEY } from '@/core/auth/session';
import { Session } from '@/core/auth/session.service';
import { STORAGE } from '@/core/storage/storage';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { createComment, expectApi, GAME_DETAILS, provideTestApi } from '../../../testing/api';
import { MemoryStorage, provideTestI18n } from '../../../testing/i18n';
import { DialogHost } from '../dialog-host';
import { getCommentFormInitial, validateCommentText } from './comment-form';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class Blank {}

const USER: { displayName: string; email: string } = {
  displayName: 'Cozy Gamer',
  email: 'cozy@mail.com',
};

interface Setup {
  fixture: ComponentFixture<DialogHost>;
  root: HTMLElement;
  router: Router;
  show: MockInstance<Snackbar['show']>;
}

async function settle(): Promise<void> {
  for (let step: number = 0; step < 3; step += 1) {
    await new Promise((resolve: (value: unknown) => void) => {
      setTimeout(resolve, 0);
    });
    TestBed.tick();
  }
}

async function setup(isSignedIn: boolean): Promise<Setup> {
  const storage: MemoryStorage = new MemoryStorage();

  if (isSignedIn) {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...USER, authenticatedAt: Date.now() }));
  }

  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      provideTestApi(),
      provideTestI18n(),
      { provide: STORAGE, useValue: storage },
      {
        provide: Authenticator,
        useValue: { signIn: vi.fn(), signOut: vi.fn((): Promise<void> => Promise.resolve()) },
      },
    ],
  });

  const router: Router = TestBed.inject(Router);

  await router.navigateByUrl('/library?game=tukoni');
  TestBed.inject(Session).watch();

  const show: MockInstance<Snackbar['show']> = vi.spyOn(TestBed.inject(Snackbar), 'show');
  const fixture: ComponentFixture<DialogHost> = TestBed.createComponent(DialogHost);

  TestBed.tick();

  const details: ReturnType<typeof expectApi> = expectApi('/games/tukoni');

  expect(details.request.params.get('userEmail')).toBe(isSignedIn ? USER.email : null);

  details.flush({ data: GAME_DETAILS });
  await settle();
  expectApi('/games/tukoni/comments').flush({
    data: [createComment()],
    meta: { totalComments: 1, returnedCount: 1 },
  });
  await fixture.whenStable();

  return { fixture, root: fixture.nativeElement as HTMLElement, router, show };
}

function element(root: HTMLElement, selector: string): HTMLElement {
  const found: HTMLElement | null = root.querySelector(selector);

  if (found === null) {
    throw new Error(`No ${selector}`);
  }

  return found;
}

describe('Game actions', () => {
  it('sends a guest to Auth over the game instead of saving a favorite', async () => {
    const { root, router, show } = await setup(false);

    element(root, 'app-favorite-button button').click();

    await vi.waitFor(() => {
      expect(router.url).toBe('/library?game=tukoni&auth=login');
    });
    expect(show).toHaveBeenCalledWith({ message: 'favorite.guest', variant: 'warning' });
  });

  it('locks the comment form of a guest', async () => {
    const { root } = await setup(false);
    const input: HTMLTextAreaElement = element(root, '#game-comment-input') as HTMLTextAreaElement;

    expect(input.disabled).toBe(true);
    expect(input.placeholder).toBe('Log in to write a comment');
    expect((element(root, '.comment-form__send') as HTMLButtonElement).disabled).toBe(true);
  });

  it('saves a favorite for a signed-in user from the server answer', async () => {
    const { root, show } = await setup(true);
    const button: HTMLButtonElement = element(
      root,
      'app-favorite-button button',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Add to Favorites');

    button.click();
    TestBed.tick();

    expect(button.disabled).toBe(true);

    const request: ReturnType<typeof expectApi> = expectApi('/games/tukoni/favorite', 'POST');

    expect(request.request.body).toEqual({ userEmail: USER.email });

    request.flush({ data: { isFavorited: true, likesCount: 121 } });
    await settle();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Remove from Favorites');
    expect(element(root, '.game-info__stat--likes').textContent).toContain('121');
    expect(show).toHaveBeenCalledWith({ message: 'favorite.added', variant: 'success' });
  });

  it('never claims a like that the server may not have saved', async () => {
    const { root, show } = await setup(true);
    const button: HTMLButtonElement = element(
      root,
      'app-comment-like-button button',
    ) as HTMLButtonElement;

    button.click();
    TestBed.tick();
    expectApi('/comments/c-1/like', 'POST').error(new ProgressEvent('error'));
    await settle();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(show).toHaveBeenCalledWith({ message: 'commentLike.unknown', variant: 'error' });

    button.click();
    TestBed.tick();
    expectApi('/comments/c-1/like', 'POST').flush({
      data: { isLikedByCurrentUser: true, likesCount: 13 },
    });
    await settle();

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent.trim()).toBe('13');
  });

  it('posts a trimmed comment and loads the latest comments again', async () => {
    const { fixture, root, show } = await setup(true);
    const input: HTMLTextAreaElement = element(root, '#game-comment-input') as HTMLTextAreaElement;

    expect(element(root, '.comment-form__avatar').textContent.trim()).toBe('C');

    input.value = '  Lovely art!  ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    TestBed.tick();

    const request: ReturnType<typeof expectApi> = expectApi('/games/tukoni/comments', 'POST');

    expect(request.request.body).toEqual({
      userEmail: USER.email,
      authorName: 'Cozy Gamer',
      text: 'Lovely art!',
    });

    request.flush({ data: createComment({ commentId: 'c-2', text: 'Lovely art!' }) });
    await settle();
    expectApi('/games/tukoni/comments').flush({
      data: [createComment({ commentId: 'c-2', text: 'Lovely art!' })],
      meta: { totalComments: 2, returnedCount: 1 },
    });
    await fixture.whenStable();

    expect(input.value).toBe('');
    expect(show).toHaveBeenCalledWith({ message: 'commentForm.posted', variant: 'success' });
    expect(element(root, '.game-comments__title').textContent.trim()).toBe('Comments (2)');
  });
});

describe('comment form helpers', () => {
  it('checks the length of a trimmed comment', () => {
    const tooLong: string = 'a'.repeat(501);

    expect(validateCommentText('')).toBe('commentForm.empty');
    expect(validateCommentText(tooLong)).toBe('commentForm.tooLong');
    expect(validateCommentText('Nice')).toBeUndefined();
  });

  it('takes the avatar letter from the profile name', () => {
    expect(getCommentFormInitial({ ...USER, displayName: 'zed', authenticatedAt: 0 })).toBe('Z');
  });
});
