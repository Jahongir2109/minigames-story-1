import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideTestI18n } from '../testing/i18n';
import { App } from './app';

describe('App', () => {
  it('renders the page outlet inside <main>', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideTestI18n()],
    });

    const fixture: ComponentFixture<App> = TestBed.createComponent(App);
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement as HTMLElement;

    expect(root.querySelector(':scope main router-outlet')).not.toBeNull();
  });
});
