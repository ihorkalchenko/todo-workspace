import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  template: `
    @if (avatarUrl()) {
      <img
        [src]="avatarUrl()"
        [alt]="displayName()"
        class="rounded-full object-cover border border-slate-200 select-none"
        [style.width.px]="size()"
        [style.height.px]="size()"
      />
    } @else {
      <div
        class="flex items-center justify-center rounded-full bg-slate-700 text-white font-semibold select-none shrink-0"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="size() * 0.4"
      >
        {{ initials() }}
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatar {
  readonly name = input<string | null | undefined>();
  readonly avatarUrl = input<string | null | undefined>();
  readonly size = input<number>(32);

  readonly displayName = computed(() => this.name()?.trim() || 'User');

  readonly initials = computed(() => {
    const parts = this.displayName().split(' ');

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return (parts[0]?.[0] || 'U').toUpperCase();
  });
}
