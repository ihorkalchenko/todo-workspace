import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TaskPriority } from '@todo-workspace/tasks';

@Component({
  selector: 'app-priority-badge',
  template: `
    <div
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors shrink-0"
      [class]="badgeClass()"
      [title]="'Priority: ' + (priority() || 'Medium')"
    >
      @switch (priority()) {
        @case ('Highest') {
          <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
          </svg>
        }
        @case ('High') {
          <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        }
        @case ('Low') {
          <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        }
        @case ('Lowest') {
          <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
          </svg>
        }
        @default {
          <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 9.75h15m-15 4.5h15" />
          </svg>
        }
      }

      @if (showLabel()) {
        <span>{{ priority() || 'Medium' }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input<TaskPriority | undefined>('Medium');
  readonly showLabel = input<boolean>(true);

  badgeClass(): string {
    switch (this.priority()) {
      case 'Highest':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Lowest':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Medium':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }
}
