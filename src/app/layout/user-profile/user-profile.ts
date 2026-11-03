import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type InputSignal,
  output,
  type OutputEmitterRef,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { getProfileInitials, getProfileName } from '@/core/auth/profile';
import type { AppSession } from '@/core/auth/session';
import { Button } from '@/shared/ui/button/button';
import { Icon } from '@/shared/ui/icon/icon';

export type UserProfileVariant = 'header' | 'menu';

/**
 * The signed-in state of the header and the mobile menu: avatar (photo, else initials, else a
 * person icon), name and the Log Out action. The name is user input and is always set as text.
 */
@Component({
  selector: 'app-user-profile',
  imports: [Button, Icon, TranslocoPipe],
  template: `
    <span class="user-avatar" aria-hidden="true">
      @if (photo(); as url) {
        <img
          class="user-avatar__image"
          alt=""
          referrerpolicy="no-referrer"
          [src]="url"
          (error)="hasBrokenPhoto.set(true)"
        />
      } @else if (initials() !== '') {
        <span class="user-avatar__initials">{{ initials() }}</span>
      } @else {
        <app-icon class="user-avatar__icon" name="user" />
      }
    </span>
    <span class="user-profile__name" [title]="name()">{{ name() }}</span>
    <button
      class="user-profile__logout"
      type="button"
      appButton
      [variant]="variant() === 'menu' ? 'outline-inverse' : 'outline'"
      (click)="logout.emit()"
    >
      {{ 'header.logout' | transloco }}
    </button>
  `,
  styleUrl: './user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': "'user-profile user-profile--' + variant()" },
})
export class UserProfile {
  readonly session: InputSignal<AppSession> = input.required<AppSession>();
  readonly variant: InputSignal<UserProfileVariant> = input.required<UserProfileVariant>();
  readonly logout: OutputEmitterRef<void> = output();

  protected readonly hasBrokenPhoto: WritableSignal<boolean> = signal(false);
  protected readonly name: Signal<string> = computed(() => getProfileName(this.session()));
  protected readonly initials: Signal<string> = computed(() => getProfileInitials(this.name()));
  protected readonly photo: Signal<string | undefined> = computed(() =>
    this.hasBrokenPhoto() ? undefined : this.session().avatarUrl,
  );
}
