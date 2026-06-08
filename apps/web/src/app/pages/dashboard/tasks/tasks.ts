import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskStatus } from '@todo-workspace/shared-interfaces';
import { TasksService } from '../../../core/tasks/tasks.service';
import { TaskSearchComponent } from './task-search/task-search';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.html',
  imports: [
    DatePipe,
    RouterLink,
    TaskSearchComponent
  ]
})
export class TasksPage {
  private readonly tasksService = inject(TasksService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly searchQuery = signal<string>('');

  readonly allTasks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allTasks = this.tasksService.tasks();

    if (!query) {
      return allTasks;
    }

    return allTasks.filter(({ title }) => title.toLowerCase().includes(query));
  });

  getStatusClasses(status: TaskStatus): string | null {
    switch (status) {
      case 'To Do':
        return 'bg-gray-50 text-gray-600 inset-ring-gray-500/10';
      case 'Doing':
        return 'bg-yellow-50 text-yellow-800 inset-ring-gray-600/20';
      case 'Done':
        return 'bg-green-50 text-green-700 inset-ring-green-600/20';
        default:
          return null;
    }
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
