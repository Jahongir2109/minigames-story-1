import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { GamesApi } from '@/core/api/games-api';
import { getCommentAuthorName, getProfileName } from '@/core/auth/profile';
import type { AppSession } from '@/core/auth/session';
import { Session } from '@/core/auth/session.service';
import { Icon } from '@/shared/ui/icon/icon';
import { Snackbar } from '@/shared/ui/snackbar/snackbar.service';

import { describeFailure } from './action-failure';

export const COMMENT_MAX_LENGTH: number = 500;

/**
 * Translation key of why a trimmed comment text cannot be sent, or `undefined` when it is valid
 * (1–500 characters).
 */
export function validateCommentText(text: string): string | undefined {
  if (text === '') {
    return 'commentForm.empty';
  }

  return text.length > COMMENT_MAX_LENGTH ? 'commentForm.tooLong' : undefined;
}

/**
 * The avatar letter of the comment form: the uppercase first character of the user name.
 */
export function getCommentFormInitial(user: AppSession): string {
  return getProfileName(user).charAt(0).toLocaleUpperCase();
}

/**
 * The comment form of Game Details: only signed-in users can write. Enter (without Shift) or the
 * Send button posts the trimmed text; the form is locked while the request runs and keeps the text
 * when it fails, without sending it again by itself.
 */
@Component({
  selector: 'app-comment-form',
  imports: [Icon, TranslocoPipe],
  template: `
    <form class="comment-form" [attr.aria-busy]="isPending()" (submit)="submit($event)">
      <span class="comment-form__avatar" aria-hidden="true">
        @if (user(); as signedIn) {
          {{ initial(signedIn) }}
        } @else {
          <app-icon class="comment-form__avatar-icon" name="user" />
        }
      </span>
      <label class="visually-hidden" for="game-comment-input">
        {{ 'commentForm.label' | transloco }}
      </label>
      <textarea
        #input
        class="comment-form__input"
        id="game-comment-input"
        name="comment"
        rows="1"
        [attr.maxlength]="maxLength"
        [attr.placeholder]="
          (isGuest() ? 'commentForm.guestPlaceholder' : 'commentForm.placeholder') | transloco
        "
        [disabled]="isGuest() || isPending()"
        [value]="text()"
        (input)="onInput()"
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <button
        class="comment-form__send"
        type="submit"
        [attr.aria-label]="'commentForm.send' | transloco"
        [attr.aria-busy]="isPending()"
        [disabled]="!canSend()"
      >
        @if (isPending()) {
          <span class="spinner" aria-hidden="true"></span>
        } @else {
          <app-icon class="comment-form__send-icon" name="send" />
        }
      </button>
    </form>
  `,
  styleUrl: './comment-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentForm {
  private readonly api: GamesApi = inject(GamesApi);
  private readonly session: Session = inject(Session);
  private readonly snackbar: Snackbar = inject(Snackbar);
  private readonly transloco: TranslocoService = inject(TranslocoService);
  private readonly input: Signal<ElementRef<HTMLTextAreaElement>> =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('input');

  readonly slug: InputSignal<string> = input.required<string>();
  /**
   * The signed-in user; a guest gets a locked form.
   */
  readonly user: InputSignal<AppSession | undefined> = input<AppSession>();
  /**
   * The server created the comment (the latest comments are loaded again).
   */
  readonly posted: OutputEmitterRef<void> = output();

  protected readonly maxLength: number = COMMENT_MAX_LENGTH;
  protected readonly text: WritableSignal<string> = signal('');
  protected readonly isPending: WritableSignal<boolean> = signal(false);
  protected readonly isGuest: Signal<boolean> = computed(() => this.user() === undefined);
  protected readonly canSend: Signal<boolean> = computed(
    () =>
      !this.isGuest() && !this.isPending() && validateCommentText(this.text().trim()) === undefined,
  );

  /**
   * Grows the textarea with its content up to its CSS max-height (88px); only then the internal
   * scrollbar appears.
   */
  private autoGrow(): void {
    const textarea: HTMLTextAreaElement = this.input().nativeElement;
    const borders: number = textarea.offsetHeight - textarea.clientHeight;
    const maxHeight: number = Number(getComputedStyle(textarea).maxHeight.replace('px', ''));

    textarea.style.height = 'auto';

    const contentHeight: number = textarea.scrollHeight + borders;

    textarea.style.height = `${String(contentHeight)}px`;
    textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }

  private async send(session: AppSession, text: string): Promise<void> {
    this.isPending.set(true);

    try {
      await firstValueFrom(
        this.api.postComment(this.slug(), {
          userEmail: session.email,
          authorName: getCommentAuthorName(session),
          text,
        }),
      );
      this.text.set('');
      this.input().nativeElement.value = '';
      this.snackbar.show({ message: 'commentForm.posted', variant: 'success' });
      this.posted.emit();
    } catch (error: unknown) {
      this.snackbar.show(
        describeFailure(error, 'commentForm.failed', 'commentForm.unknown', (key: string) =>
          this.transloco.translate(key),
        ),
      );
    } finally {
      this.isPending.set(false);
      this.autoGrow();
    }
  }

  protected initial(user: AppSession): string {
    return getCommentFormInitial(user);
  }

  protected onInput(): void {
    this.text.set(this.input().nativeElement.value);
    this.autoGrow();
  }

  // Enter sends the comment, Shift + Enter starts a new line.
  protected onEnter(event: Event): void {
    const keyboard: KeyboardEvent = event as KeyboardEvent;

    if (keyboard.shiftKey || keyboard.isComposing) {
      return;
    }

    event.preventDefault();
    this.input().nativeElement.form?.requestSubmit();
  }

  protected submit(event: Event): void {
    event.preventDefault();

    if (this.isPending()) {
      return;
    }

    const text: string = this.text().trim();
    const error: string | undefined = validateCommentText(text);

    if (error !== undefined) {
      this.snackbar.show({
        message: error,
        params: { max: COMMENT_MAX_LENGTH },
        variant: 'error',
      });
      return;
    }

    const session: AppSession | undefined = this.session.require('commentForm.guest');

    if (session !== undefined) {
      void this.send(session, text);
    }
  }
}
