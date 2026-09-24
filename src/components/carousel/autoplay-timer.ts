export interface AutoplayTimer {
  /**
   * Starts a full interval (also after a swipe or an arrow click).
   */
  restart: () => void;
  /**
   * Freezes the countdown while the slider is held.
   */
  pause: () => void;
  /**
   * Continues with the time that was left when it was paused.
   */
  resume: () => void;
  stop: () => void;
}

/**
 * Repeating timer that can be paused and resumed with the remaining time.
 */
export function createAutoplayTimer(interval: number, onTick: () => void): AutoplayTimer {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let startedAt: number = 0;
  let remaining: number = interval;
  let isPaused: boolean = false;

  const clear = (): void => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  const schedule = (): void => {
    clear();
    startedAt = performance.now();
    timeoutId = setTimeout((): void => {
      remaining = interval;
      onTick();

      if (!isPaused) {
        schedule();
      }
    }, remaining);
  };

  const restart = (): void => {
    remaining = interval;
    isPaused = false;
    schedule();
  };

  const pause = (): void => {
    if (isPaused) {
      return;
    }

    isPaused = true;
    clear();
    remaining = Math.max(remaining - (performance.now() - startedAt), 0);
  };

  const resume = (): void => {
    if (!isPaused) {
      return;
    }

    isPaused = false;
    schedule();
  };

  const stop = (): void => {
    isPaused = true;
    clear();
  };

  return { restart, pause, resume, stop };
}
