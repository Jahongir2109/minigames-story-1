import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';

import { provideTestI18n } from '../../../../testing/i18n';
import { SnackbarHost } from './snackbar-host';
import {
  Snackbar,
  SNACKBAR_DURATION,
  SNACKBAR_MAX_VISIBLE,
  type SnackbarMessage,
} from './snackbar.service';

function setup(): Snackbar {
  TestBed.configureTestingModule({ providers: [provideTestI18n()] });

  return TestBed.inject(Snackbar);
}

function texts(snackbar: Snackbar): string[] {
  return snackbar.messages().map((item: SnackbarMessage) => item.message);
}

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides a message after its duration', () => {
    const snackbar: Snackbar = setup();

    snackbar.show({ message: 'errors.title' });
    vi.advanceTimersByTime(SNACKBAR_DURATION - 1);

    expect(texts(snackbar)).toEqual(['errors.title']);

    vi.advanceTimersByTime(1);

    expect(texts(snackbar)).toEqual([]);
  });

  it('keeps a paused message until it is resumed', () => {
    const snackbar: Snackbar = setup();

    snackbar.show({ message: 'errors.title', duration: 100 });

    const [message] = snackbar.messages();

    snackbar.pause(message?.id ?? 0);
    vi.advanceTimersByTime(1000);

    expect(snackbar.messages()).toHaveLength(1);

    snackbar.resume(message?.id ?? 0);
    vi.advanceTimersByTime(100);

    expect(snackbar.messages()).toHaveLength(0);
  });

  it('drops the oldest messages beyond the visible limit', () => {
    const snackbar: Snackbar = setup();

    for (let index: number = 0; index <= SNACKBAR_MAX_VISIBLE; index += 1) {
      snackbar.show({ message: `message-${String(index)}` });
    }

    expect(texts(snackbar)).toEqual(['message-1', 'message-2', 'message-3']);
  });
});

describe('SnackbarHost', () => {
  it('renders translated messages above dialogs and closes them on demand', async () => {
    const snackbar: Snackbar = setup();
    const fixture: ComponentFixture<SnackbarHost> = TestBed.createComponent(SnackbarHost);
    const root: HTMLElement = fixture.nativeElement as HTMLElement;
    const region: HTMLElement | null = root.querySelector('.snackbar-region');

    snackbar.show({ message: 'errors.title', variant: 'error' });
    await fixture.whenStable();

    const message: HTMLElement | null = root.querySelector('.snackbar');

    expect(region?.dataset['popoverOpen']).toBe('true');
    expect(message?.classList).toContain('snackbar--error');
    expect(message?.getAttribute('role')).toBe('alert');
    expect(message?.textContent).toContain('Something went wrong');

    TestBed.inject(TranslocoService).setActiveLang('ru');
    await fixture.whenStable();

    expect(root.querySelector('.snackbar')?.textContent).toContain('Что-то пошло не так');

    root.querySelector<HTMLButtonElement>('.snackbar__close')?.click();
    await fixture.whenStable();

    expect(root.querySelector('.snackbar')).toBeNull();
    expect(region?.dataset['popoverOpen']).toBeUndefined();
  });
});
