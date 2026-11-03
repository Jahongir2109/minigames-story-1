import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { LanguageStore } from '@/core/i18n/language.store';
import { STORAGE } from '@/core/storage/storage';
import { NotFound } from '@/pages/not-found/not-found';

import { MemoryStorage, provideTestI18n } from '../../testing/i18n';
import { App } from '../app';

@Component({ template: '' })
class Blank {}

async function setup(url: string = '/'): Promise<{
  fixture: ComponentFixture<App>;
  root: HTMLElement;
  router: Router;
}> {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([
        { path: '', component: Blank, data: { page: 'home' } },
        { path: 'library', component: Blank, data: { page: 'library' } },
        { path: '**', component: NotFound, data: { page: 'not-found' } },
      ]),
      provideTestI18n(),
      { provide: STORAGE, useValue: new MemoryStorage() },
    ],
  });

  const fixture: ComponentFixture<App> = TestBed.createComponent(App);
  const router: Router = TestBed.inject(Router);

  await router.navigateByUrl(url);
  await fixture.whenStable();

  return { fixture, root: fixture.nativeElement as HTMLElement, router };
}

function currentLinks(root: HTMLElement, selector: string): string[] {
  return [...root.querySelectorAll(`${selector}[aria-current="page"]`)].map((link: Element) =>
    link.textContent.trim(),
  );
}

describe('Layout', () => {
  it('marks the link of the open page in the header and the mobile menu', async () => {
    const { fixture, root, router } = await setup('/');

    expect(currentLinks(root, '.header__link')).toEqual(['Home']);
    expect(currentLinks(root, '.mobile-menu__link')).toEqual(['Home']);

    await router.navigateByUrl('/library');
    await fixture.whenStable();

    expect(currentLinks(root, '.header__link')).toEqual(['Library']);

    await router.navigateByUrl('/missing');
    await fixture.whenStable();

    expect(currentLinks(root, '.header__link')).toEqual([]);
    expect(root.querySelector('h1')?.textContent).toBe('Page Not Found');
  });

  it('opens and closes the mobile menu with the burger button', async () => {
    const { fixture, root } = await setup();
    const burger: HTMLButtonElement | null = root.querySelector('.header__burger');
    const menu: HTMLDialogElement | null = root.querySelector('dialog.mobile-menu');

    burger?.click();
    await fixture.whenStable();

    expect(menu?.open).toBe(true);
    expect(burger?.getAttribute('aria-expanded')).toBe('true');
    expect(document.documentElement.classList.contains('scroll-locked')).toBe(true);

    root.querySelector<HTMLButtonElement>('.mobile-menu__close')?.click();
    await fixture.whenStable();

    expect(menu?.open).toBe(false);
    expect(burger?.getAttribute('aria-expanded')).toBe('false');
    expect(document.documentElement.classList.contains('scroll-locked')).toBe(false);
  });

  it('asks for the Auth dialog through the URL', async () => {
    const { fixture, root, router } = await setup('/library');

    root.querySelector<HTMLButtonElement>('.header__signup')?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/library?auth=register');
  });

  it('switches the whole layout to another language without a reload', async () => {
    const { fixture, root } = await setup();
    const toggle: HTMLButtonElement | null = root.querySelector(
      ':scope .header .language-switcher__toggle',
    );

    await TestBed.inject(LanguageStore).init();
    toggle?.click();
    await fixture.whenStable();

    const options: HTMLElement[] = [
      ...root.querySelectorAll<HTMLElement>(':scope .header .language-switcher__option'),
    ];

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(options.map((option: HTMLElement) => option.textContent.trim())).toEqual([
      'English',
      'Oʻzbekcha',
      'Русский',
    ]);

    options[2]?.click();
    await fixture.whenStable();
    await vi.waitFor(() => {
      expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('ru');
    });
    await fixture.whenStable();

    expect(document.documentElement.lang).toBe('ru');
    expect(root.querySelector('.header__login')?.textContent.trim()).toBe('Войти');
    expect(root.querySelector('.footer__description')?.textContent).toContain('мини-игр');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the language list with Escape and returns the focus', async () => {
    const { fixture, root } = await setup();
    const toggle: HTMLButtonElement | null = root.querySelector(
      ':scope .header .language-switcher__toggle',
    );

    toggle?.click();
    await fixture.whenStable();
    root
      .querySelector(':scope .header .language-switcher__option')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('shows the current year in the footer', async () => {
    const { root } = await setup();

    expect(root.querySelector('.footer__copyright')?.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
});
