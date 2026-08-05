import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { Task } from '@todo-workspace/tasks';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe],
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'group flex flex-col gap-2 p-4 bg-white rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors'
  },
})
export class TaskCard {
  private readonly router = inject(Router);

  readonly task = input.required<Task>();

  editTask(event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/tasks', this.task().id]);
  }
}
