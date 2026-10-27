import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';

import { TaskList } from './task-list/task-list';
import { Task, TaskStatus } from '@todo-workspace/tasks';
import { TasksService } from '../../../core/tasks/tasks.service';
import { TaskSearchComponent } from './task-search/task-search';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { TaskFilterService } from './task-filter.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.html',
  imports: [RouterLink, CdkDropListGroup, TaskSearchComponent, TaskList],
  providers: [TaskFilterService]
})
export class TasksPage {
  private readonly tasksService = inject(TasksService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  readonly taskFilterService = inject(TaskFilterService);

  drop(event: CdkDragDrop<Task[]>, status: TaskStatus) {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    this.tasksService.moveTask(task.id, status, event.currentIndex);
  }

  async deleteTask(id: number) {
    const confirmed = await this.confirmDialogService.confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
    });

    if (confirmed) {
      this.tasksService.deleteTask(id);
    }
  }
}
