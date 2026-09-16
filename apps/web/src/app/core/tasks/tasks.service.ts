import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

import { TasksDataService } from './tasks-data.service';
import { Task, TaskStatus, TaskPriority } from '@todo-workspace/tasks';

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
};

export const TasksService = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, tasksDataService = inject(TasksDataService)) => ({
    loadTasks() {
      patchState(store, { isLoading: true });

      tasksDataService
        .getTasks()
        .subscribe({
          next: tasks => patchState(store, { tasks, isLoading: false }),
          error: err => patchState(store, { isLoading: false }),
        });
    },

    getTask(id: number) {
      return tasksDataService.getTask(id);
    },

    createTask(data: Pick<Task, 'title' | 'description' | 'userId'> & { priority?: TaskPriority }) {
      tasksDataService
        .createTask(data)
        .subscribe((newTask) => {
          patchState(store, { tasks: [...store.tasks(), newTask] });
        });
    },

    updateTask(id: number, data: Partial<Task>) {
      tasksDataService
        .updateTask(id, data)
        .subscribe((updatedTask) => {
          patchState(store, {
            tasks: store.tasks().map(t => (t.id === id ? updatedTask : t)),
          });
        });
    },

    /**
     * Delete a task by ID from store state.
     */
    deleteTask(id: number) {
      tasksDataService
        .deleteTask(id)
        .subscribe(() => {
          patchState(store, {
            tasks: store.tasks().filter(t => t.id !== id),
          });
        });
    },

    /**
     * Move task across status columns or reorder position with optimistic UI updates.
     */
    moveTask(id: number, targetStatus: TaskStatus, targetOrder: number) {
      const currentTasks = store.tasks();
      const taskToMove = currentTasks.find(t => t.id === id);

      if (!taskToMove) return;

      const updatedTasks = calculateNewOrders(currentTasks, taskToMove, targetStatus, targetOrder);
      patchState(store, { tasks: updatedTasks });

      tasksDataService
        .moveTask(id, targetStatus, targetOrder)
        .subscribe({
          error: () => tasksDataService.getTasks().subscribe(tasks => patchState(store, { tasks })),
        });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadTasks();
    },
  }),
);

/**
 * Helper to calculate updated orders for optimistic drag-and-drop moves.
 */
function calculateNewOrders(
  currentTasks: Task[],
  movedTask: Task,
  targetStatus: TaskStatus,
  targetOrder: number
): Task[] {
  const { id, status: sourceStatus } = movedTask;

  const sourceList = getSortedTasksByStatus(currentTasks, sourceStatus, id);
  const targetList = sourceStatus === targetStatus ? sourceList : getSortedTasksByStatus(currentTasks, targetStatus);

  const updatedTargetTask = { ...movedTask, status: targetStatus, order: targetOrder };
  targetList.splice(targetOrder, 0, updatedTargetTask);

  sourceList.forEach((t, i) => (t.order = i));
  targetList.forEach((t, i) => (t.order = i));

  return currentTasks.map((t) => {
    if (t.id === id) {
      return updatedTargetTask;
    }

    const updatedSource = sourceList.find((s) => s.id === t.id);
    if (updatedSource) {
      return { ...t, order: updatedSource.order };
    }

    const updatedTarget = targetList.find((s) => s.id === t.id);
    if (updatedTarget) {
      return { ...t, order: updatedTarget.order };
    }

    return t;
  });
}

/**
 * Helper to filter and sort tasks by status column index.
 */
function getSortedTasksByStatus(tasks: Task[], status: TaskStatus, excludedId?: number): Task[] {
  return tasks
    .filter(t => t.status === status && t.id !== excludedId)
    .sort((a, b) => a.order - b.order)
    .map(t => ({ ...t }));
}
