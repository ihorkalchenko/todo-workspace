import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tag } from '@todo-workspace/tasks';

@Component({
  selector: 'app-tag-badge',
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
      [style.background-color]="tag().color"
    >
      {{ tag().name }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBadgeComponent {
  readonly tag = input.required<Tag>();
}
