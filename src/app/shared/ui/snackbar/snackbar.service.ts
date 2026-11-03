import { Injectable, type Signal, signal, type WritableSignal } from '@angular/core';
import type { TranslationParameters } from '@/core/i18n/translation-parameters';

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error';

export interface SnackbarOptions {
  /**
   * Translation key of the text; it follows the language while the message is shown.
   */
  message: string;
  params?: TranslationParameters;
  variant?: SnackbarVariant;
  /**
   * Time in milliseconds before the message hides itself.
   */
  duration?: number;
}

export interface SnackbarMessage {
  id: number;
  message: string;
  params: TranslationParameters;
  variant: SnackbarVariant;
}

export const SNACKBAR_DURATION: number = 4000;
// Older messages are dropped so the stack never covers the page.
export const SNACKBAR_MAX_VISIBLE: number = 3;

interface Countdown {
  timer: ReturnType<typeof setTimeout> | undefined;
  duration: number;
}

/**
 * Short non-blocking notifications at the bottom of the screen, used instead of `alert()`. A
 * message hides itself after a while; hovering or focusing it keeps it open.
 */
@Injectable({ providedIn: 'root' })
export class Snackbar {
  private readonly items: WritableSignal<readonly SnackbarMessage[]> = signal([]);
  private readonly countdowns: Map<number, Countdown> = new Map<number, Countdown>();
  private lastId: number = 0;

  readonly messages: Signal<readonly SnackbarMessage[]> = this.items.asReadonly();

  private stop(id: number): void {
    this.pause(id);
    this.countdowns.delete(id);
  }

  show(options: SnackbarOptions): void {
    this.lastId += 1;

    const message: SnackbarMessage = {
      id: this.lastId,
      message: options.message,
      params: options.params ?? {},
      variant: options.variant ?? 'info',
    };
    const visible: SnackbarMessage[] = [...this.items(), message];
    const dropped: SnackbarMessage[] = visible.splice(0, visible.length - SNACKBAR_MAX_VISIBLE);

    for (const old of dropped) {
      this.stop(old.id);
    }

    this.items.set(visible);
    this.countdowns.set(message.id, {
      timer: undefined,
      duration: options.duration ?? SNACKBAR_DURATION,
    });
    this.resume(message.id);
  }

  dismiss(id: number): void {
    this.stop(id);
    this.items.update((items: readonly SnackbarMessage[]) =>
      items.filter((item: SnackbarMessage) => item.id !== id),
    );
  }

  /**
   * Keeps the message open while the user reads or uses it.
   */
  pause(id: number): void {
    const countdown: Countdown | undefined = this.countdowns.get(id);

    if (countdown === undefined) {
      return;
    }

    clearTimeout(countdown.timer);
    countdown.timer = undefined;
  }

  /**
   * Starts the full countdown again.
   */
  resume(id: number): void {
    const countdown: Countdown | undefined = this.countdowns.get(id);

    if (countdown === undefined) {
      return;
    }

    clearTimeout(countdown.timer);
    countdown.timer = setTimeout(() => {
      this.dismiss(id);
    }, countdown.duration);
  }
}
