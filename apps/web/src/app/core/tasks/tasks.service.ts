import { inject, Injectable, signal } from '@angular/core';
import { TasksDataService } from './tasks-data.service';

import { Task, TaskStatus } from '@todo-workspace/tasks';

/**
 * TODO: Rewrite using store
 * */
@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly tasksDataService = inject(TasksDataService);

  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  constructor() {
    this.loadTasks();
  }

  getTask(id: number) {
    return this.tasksDataService.getTask(id);
  }

  createTask(data: Pick<Task, 'title' | 'description'>) {
    this.tasksDataService.createTask(data).subscribe(newTask => {
      this._tasks.update(list => [...list, newTask]);
    });
  }

  updateTask(id: number, data: Partial<Task>) {
    this.tasksDataService.updateTask(id, data).subscribe(updatedTask => {
      this._tasks.update(list => list.map(task => task.id === id ? updatedTask : task));
    });
  }

  deleteTask(id: number) {
    this.tasksDataService.deleteTask(id).subscribe(() => {
      this._tasks.update(list => list.filter(task => task.id !== id));
    });
  }

  moveTask(id: number, targetStatus: TaskStatus, targetOrder: number) {
    const currentTasks = this._tasks();
    const taskToMove = currentTasks.find(t => t.id === id);

    if (!taskToMove) return;

    const updatedTasks = this.calculateNewOrders(currentTasks, taskToMove, targetStatus, targetOrder);
    this._tasks.set(updatedTasks);

    this.tasksDataService.moveTask(id, targetStatus, targetOrder).subscribe({
      error: (err) => {
       console.error('Failed to update task order', err);
       this.loadTasks();
      }
    });
  }

  /**
   * Loads all tasks from the data service and updates the tasks signal.
   */
  private loadTasks(): void {
    this.tasksDataService.getTasks().subscribe(tasks => this._tasks.set(tasks));
  }

  /**
   * Helper to calculate the new list of tasks with updated order values immutably.
   * */
  private calculateNewOrders(currentTasks: Task[], movedTask: Task, targetStatus: TaskStatus, targetOrder: number) {
    const { id, status: sourceStatus } = movedTask;

    const sourceList = this.getSortedTasksByStatus(currentTasks, sourceStatus, id);
    const targetList = sourceStatus === targetStatus
      ? sourceList
      : this.getSortedTasksByStatus(currentTasks, targetStatus);

    const updatedTargetTask = { ...movedTask, status: targetStatus, order: targetOrder };
    targetList.splice(targetOrder, 0, updatedTargetTask);

    sourceList.forEach((t, i) => t.order = i);
    targetList.forEach((t, i) => t.order = i);

    return currentTasks.map(t => {
      if (t.id === id) {
        return updatedTargetTask;
      }

      const updatedSource = sourceList.find(s => s.id === t.id);

      if (updatedSource) {
        return { ...t, order: updatedSource.order };
      }

      const updatedTarget = targetList.find(s => s.id === t.id);

      if (updatedTarget) {
        return { ...t, order: updatedTarget.order };
      }

      return t;
    });
  }

  /**
   * Helper to get sorted tasks under a specific status, optionally excluding one ID.
   *
   * */
  private getSortedTasksByStatus(tasks: Task[], status: TaskStatus, excludedId?: number) {
    return tasks
      .filter(t => t.status === status && t.id !== excludedId)
      .sort((a, b) => a.order - b.order)
      .map(t => ({ ...t }));
  }
}
