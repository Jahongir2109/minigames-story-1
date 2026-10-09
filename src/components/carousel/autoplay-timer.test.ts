import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { type AutoplayTimer, createAutoplayTimer } from './autoplay-timer';

const INTERVAL: number = 4000;

const onTick: Mock<() => void> = vi.fn();

function setup(): AutoplayTimer {
  return createAutoplayTimer(INTERVAL, onTick);
}

beforeEach(() => {
  vi.useFakeTimers();
  onTick.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createAutoplayTimer', () => {
  it('ticks every interval after a restart', () => {
    const timer: AutoplayTimer = setup();

    timer.restart();
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(onTick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    vi.advanceTimersByTime(INTERVAL);
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it('continues with the remaining time after a pause', () => {
    const timer: AutoplayTimer = setup();

    timer.restart();
    vi.advanceTimersByTime(1000);
    timer.pause();
    timer.pause();
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(onTick).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(INTERVAL - 1000 - 1);
    expect(onTick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('ignores a resume without a pause', () => {
    const timer: AutoplayTimer = setup();

    timer.restart();
    timer.resume();
    vi.advanceTimersByTime(INTERVAL);

    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('starts a full interval again on restart', () => {
    const timer: AutoplayTimer = setup();

    timer.restart();
    vi.advanceTimersByTime(3000);
    timer.restart();
    vi.advanceTimersByTime(3000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it('stops ticking', () => {
    const timer: AutoplayTimer = setup();

    timer.restart();
    timer.stop();
    vi.advanceTimersByTime(INTERVAL * 3);

    expect(onTick).not.toHaveBeenCalled();
  });
});
