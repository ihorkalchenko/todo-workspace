import { describe, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Task, TaskPriority, TaskStatus } from '@todo-workspace/tasks';
import { TasksService } from './tasks.service';
import { TasksDataService } from './tasks-data.service';

describe('TasksService', () => {
  let service: InstanceType<typeof TasksService>;
  let mockDataService: {
    getTasks: ReturnType<typeof vi.fn>;
    getTask: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    moveTask: ReturnType<typeof vi.fn>;
  };

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'First Task',
      description: 'First Description',
      status: 'To Do',
      priority: 'Medium',
      order: 0,
      createdAt: '2026-09-16T10:00:00Z',
      userId: 42,
      user: { name: 'Alice' },
    },
    {
      id: 2,
      title: 'Second Task',
      description: 'Second Description',
      status: 'Doing',
      priority: 'High',
      order: 0,
      createdAt: '2026-09-16T10:05:00Z',
      userId: 42,
      user: { name: 'Alice' },
    },
  ];

  beforeEach(() => {
    mockDataService = {
      getTasks: vi.fn().mockReturnValue(of(mockTasks)),
      getTask: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      moveTask: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TasksDataService, useValue: mockDataService }],
    });

    service = TestBed.inject(TasksService);
  });

  it('should initialize and load tasks via onInit hook', () => {
    expect(mockDataService.getTasks).toHaveBeenCalledTimes(1);
    expect(service.tasks()).toEqual(mockTasks);
    expect(service.isLoading()).toEqual(false);
  });

  describe('loadTasks', () => {
    it('should fetch tasks and update store state', () => {
      const freshTasks: Task[] = [
        ...mockTasks,
        {
          id: 3,
          title: 'Third Task',
          description: 'Third Description',
          status: 'Done',
          priority: 'Lowest',
          order: 0,
          createdAt: '2026-09-16T11:00:00Z',
          userId: 42,
        },
      ];

      mockDataService.getTasks.mockReturnValueOnce(of(freshTasks));

      service.loadTasks();

      expect(mockDataService.getTasks).toHaveBeenCalled();
      expect(service.tasks()).toEqual(freshTasks);
      expect(service.isLoading()).toEqual(false);
    });

    it('should set isLoading to false on API error', () => {
      mockDataService.getTasks.mockReturnValueOnce(throwError(() => new Error('Server Error')));

      service.loadTasks();

      expect(service.isLoading()).toEqual(false);
    });
  });

  describe('getTask', () => {
    it('should delegate getTask call to TasksDataService', () => {
      mockDataService.getTask.mockReturnValueOnce(mockTasks[0]);

      service.getTask(1);

      expect(mockDataService.getTask).toHaveBeenCalledWith(1);
    });
  });

  describe('createTask', () => {
    it('should append newly created task to the store state list', () => {
      const newTaskPayload = {
        title: 'New Feature Task',
        description: 'Implement UI components',
        priority: 'Highest' as TaskPriority,
        userId: 42,
      };

      const createdTask: Task = {
        id: 3,
        ...newTaskPayload,
        status: 'To Do',
        order: 1,
        createdAt: '2026-09-16T10:00:00Z',
      };

      mockDataService.createTask.mockReturnValueOnce(of(createdTask));

      service.createTask(newTaskPayload);

      expect(mockDataService.createTask).toHaveBeenCalledWith(newTaskPayload);
      expect(service.tasks()).toEqual([...mockTasks, createdTask]);
    });
  });

  describe('updateTask', () => {
    it('should update task details in the store state', () => {
      const mockUpdatedTask = {
        title: 'Updated Title',
        priority: 'High' as const,
      };

      const updatedTask: Task = {
        ...mockTasks[0],
        ...mockUpdatedTask,
      };

      mockDataService.updateTask.mockReturnValueOnce(of(updatedTask));

      service.updateTask(1, mockUpdatedTask);

      expect(mockDataService.updateTask).toHaveBeenCalledWith(1, mockUpdatedTask);
      expect(service.tasks().find(t => t.id === 1)?.title).toBe(mockUpdatedTask.title);
      expect(service.tasks().find(t => t.id === 1)?.priority).toBe(mockUpdatedTask.priority);
    });
  });

  describe('deleteTask', () => {
    it('should remove the deleted task from store state', () => {
      mockDataService.deleteTask.mockReturnValueOnce(of(void 0));

      service.deleteTask(1);

      expect(mockDataService.deleteTask).toHaveBeenCalledWith(1);
      expect(service.tasks()).toEqual([mockTasks[1]]);
    });
  });

  describe('moveTask', () => {
    it('should optimistically update task status and order in store', () => {
      mockDataService.moveTask.mockReturnValueOnce(of(void 0));

      service.moveTask(1, 'Doing' as TaskStatus, 1);

      const movedTask = service.tasks().find(t => t.id === 1);

      expect(movedTask?.status).toBe('Doing');
      expect(movedTask?.order).toBe(1);
      expect(mockDataService.moveTask).toHaveBeenCalledWith(1, 'Doing', 1);
    });

    it('should re-fetch tasks and rollback store state if more API call fails', () => {
      mockDataService.moveTask.mockReturnValueOnce(throwError(() => new Error('Move Failed')));
      mockDataService.getTasks.mockReturnValueOnce(of(mockTasks));

      service.moveTask(1, 'Done' as TaskStatus, 0);

      expect(mockDataService.getTasks).toHaveBeenCalled();
    });
  });
});
