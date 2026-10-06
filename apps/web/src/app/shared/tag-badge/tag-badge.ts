import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tag } from '@todo-workspace/tasks';

@Component({
  selector: 'app-tag-badge',
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 gap-1 rounded-full text-xs font-medium text-white shadow-sm"
      [style.background-color]="tag().color"
    >
      <span>{{ tag().name }}</span>

      @if (removable()) {
        <button
          type="button"
          (click)="onClose($event)"
          class="inline-flex items-center justify-center -me-1 h-3.5 w-3.5 pb-0.5 rounded-full hover:bg-black/20 focus:outline-none transition-colors cursor-pointer"
          [attr.aria-label]="'Remove ' + tag().name"
        >
          <span class="leading-none text-xs">&times;</span>
        </button>
      }
    </span>
  `,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBadgeComponent {
  readonly tag = input.required<Tag>();
  readonly removable = input(false);
  readonly close = output<Tag>();

  onClose(event: MouseEvent) {
    event.stopPropagation();
    this.close.emit(this.tag());
  }
}
