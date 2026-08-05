import { ChangeDetectionStrategy, Component, input} from '@angular/core';
import { DatePipe } from '@angular/common';

import { Task } from '@todo-workspace/tasks';

@Component({
  selector: 'app-task-card',
  imports: [DatePipe],
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-2 p-4 bg-white rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors'
  },
})
export class TaskCard {
  readonly task = input.required<Task>();
}
