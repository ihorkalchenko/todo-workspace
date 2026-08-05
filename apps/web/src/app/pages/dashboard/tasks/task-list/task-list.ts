import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { TaskCard } from '../task-card/task-card';
import { Task } from '@todo-workspace/tasks';

@Component({
  selector: 'app-task-list',
  imports: [
    CdkDrag,
    CdkDropList,
    TaskCard,
  ],
  templateUrl: './task-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-gray-100 rounded-lg p-4 flex flex-col max-h-full border border-gray-200 shadow-sm' },
})
export class TaskList {
  readonly title = input.required<string>();
  readonly tasks = input.required<Task[]>();

  readonly dropped = output<CdkDragDrop<Task[]>>();
}
