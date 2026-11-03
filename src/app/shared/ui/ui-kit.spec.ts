import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTestI18n } from '../../../testing/i18n';
import { Button, type ButtonSize, type ButtonVariant } from './button/button';
import { EmptyState } from './empty-state/empty-state';
import { ErrorBanner } from './error-banner/error-banner';
import { Icon } from './icon/icon';
import { ScrollLock } from './scroll-lock';
import { SectionTitle } from './section-title/section-title';

@Component({
  imports: [Button, EmptyState, ErrorBanner, Icon, SectionTitle],
  template: `
    <app-icon class="test-icon" name="close" />
    <button type="button" appButton [variant]="variant()" [size]="size()">Go</button>
    <app-section-title headingId="test-title">Top Players</app-section-title>
    <app-empty-state title="Nothing here" message="Try later">
      <button type="button">Reset</button>
    </app-empty-state>
    <app-empty-state title="No action" />
    <app-error-banner
      message="Server down"
      [retryable]="retryable()"
      (retry)="retries.update(add)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly variant: WritableSignal<ButtonVariant> = signal('primary');
  readonly size: WritableSignal<ButtonSize> = signal('medium');
  readonly retryable: WritableSignal<boolean> = signal(true);
  readonly retries: WritableSignal<number> = signal(0);

  readonly add = (value: number): number => value + 1;
}

async function setup(): Promise<{ fixture: ComponentFixture<Host>; root: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [Host], providers: [provideTestI18n()] });

  const fixture: ComponentFixture<Host> = TestBed.createComponent(Host);
  await fixture.whenStable();

  return { fixture, root: fixture.nativeElement as HTMLElement };
}

function byName(first: string, second: string): number {
  return first.localeCompare(second);
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const element: HTMLElement | null = root.querySelector(selector);

  if (element === null) {
    throw new Error(`${selector} is not rendered`);
  }

  return element;
}

describe('UI kit', () => {
  it('inlines the bundled SVG of an icon and hides it from screen readers', async () => {
    const { root } = await setup();
    const icon: HTMLElement = query(root, 'app-icon.test-icon');

    expect(icon.querySelector('svg')).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives a button the classes of its variant and size', async () => {
    const { fixture, root } = await setup();
    const button: HTMLElement = query(root, 'button[appButton]');

    expect([...button.classList].toSorted(byName)).toEqual([
      'button',
      'button--medium',
      'button--primary',
    ]);

    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.size.set('adaptive');
    await fixture.whenStable();

    expect([...button.classList].toSorted(byName)).toEqual([
      'button',
      'button--adaptive',
      'button--outline',
    ]);
  });

  it('renders the section heading with its id', async () => {
    const { root } = await setup();
    const heading: HTMLElement = query(root, 'app-section-title h2');

    expect(heading.id).toBe('test-title');
    expect(heading.textContent.trim()).toBe('Top Players');
  });

  it('shows the empty state text and its projected action', async () => {
    const { root } = await setup();
    const states: NodeListOf<HTMLElement> = root.querySelectorAll('app-empty-state');

    expect(states[0]?.getAttribute('role')).toBe('status');
    expect(states[0]?.textContent).toContain('Nothing here');
    expect(states[0]?.textContent).toContain('Try later');
    expect(states[0]?.querySelector('button')?.textContent).toBe('Reset');
    expect(states[1]?.querySelector('.empty-state__message')).toBeNull();
  });

  it('shows a translated error banner whose Retry button repeats the request', async () => {
    const { fixture, root } = await setup();
    const banner: HTMLElement = query(root, 'app-error-banner');

    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('Something went wrong');
    expect(banner.textContent).toContain('Server down');

    query(banner, 'button').click();

    expect(fixture.componentInstance.retries()).toBe(1);

    fixture.componentInstance.retryable.set(false);
    await fixture.whenStable();

    expect(banner.querySelector('button')).toBeNull();
  });
});

describe('ScrollLock', () => {
  it('keeps the page locked until the last overlay is closed', () => {
    const lock: ScrollLock = TestBed.inject(ScrollLock);
    const root: HTMLElement = document.documentElement;

    lock.lock();
    lock.lock();
    lock.unlock();

    expect(root.classList.contains('scroll-locked')).toBe(true);

    lock.unlock();
    lock.unlock();

    expect(root.classList.contains('scroll-locked')).toBe(false);
  });
});
