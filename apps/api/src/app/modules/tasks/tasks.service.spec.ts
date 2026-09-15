import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../../db/db.module';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

import { Task } from '@todo-workspace/tasks';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  const mockUserId = 42;
  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'First Task',
      description: 'Test Description',
      status: 'To Do',
      priority: 'Medium',
      order: 0,
      createdAt: new Date().toISOString(),
      userId: 42,
      user: { name: 'Alice' },
    },
    {
      id: 2,
      title: 'Second Task',
      description: 'Another Description',
      status: 'Doing',
      priority: 'High',
      order: 1,
      createdAt: new Date().toISOString(),
      userId: 42,
      user: { name: 'Alice' },
    },
  ];

  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockUpdateSet = vi.fn();
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

  const mockDB = {
    query: {
      tasks: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    transaction: vi.fn((cb: (tx: any) => any) => cb(mockDB)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: DRIZZLE, useValue: mockDB },
      ]
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return a list of all tasks with user metadata', async () => {
      mockDB.query.tasks.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTasks();

      expect(result).toEqual(mockTasks);
      expect(mockDB.query.tasks.findMany).toHaveBeenCalledWith({
        orderBy: expect.any(Function),
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });
  });

  describe('getTask', () => {
    it('should return a single task by ID when it exists', async () => {
      const targetTask = mockTasks[0];
      mockDB.query.tasks.findFirst.mockResolvedValue(targetTask);

      const result = await service.getTask(1);

      expect(result).toEqual(targetTask);
      expect(mockDB.query.tasks.findFirst).toHaveBeenCalledWith({
        where: eq(schema.tasks.id, 1),
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });

    it('should return undefined when task with given ID is not found', async () => {
      mockDB.query.tasks.findFirst.mockResolvedValue(undefined);

      const result = await service.getTask(999);

      expect(result).toBeUndefined();
    });
  });

  describe('createTask', () => {
    it('should create a task with default priority "Medium" and record activity', async () => {
      const createTaskData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'Medium' as const,
        userId: mockUserId,
      };

      const createdTask: Task = {
        id: 3,
        status: 'To Do',
        order: 0,
        createdAt: new Date().toISOString(),
        ...createTaskData,
      };

      mockWhere.mockResolvedValue([{ maxOrder: -1 }]);

      const mockReturningTask = vi.fn().mockResolvedValue([createdTask]);
      mockInsertValues.mockReturnValueOnce({  returning: mockReturningTask });
      mockInsertValues.mockReturnValueOnce(Promise.resolve());

      const result = await service.createTask(mockUserId, createTaskData);

      expect(result).toEqual(createdTask);
      expect(mockInsert).toHaveBeenCalledWith(schema.tasks);
      expect(mockInsert).toHaveBeenCalledWith(schema.activities);
    });
  });

  describe('updateTask', () => {
    it('should update task details and log change activity', async () => {
      const existingTask = mockTasks[0];
      const updatedTask: Task = {
        ...existingTask,
        title: 'Updated Title',
        priority: 'High',
      };

      mockWhere.mockResolvedValueOnce([existingTask]);

      const mockReturningUpdated = vi.fn().mockReturnValue([updatedTask]);
      mockUpdateSet.mockReturnValueOnce({ where: vi.fn().mockReturnValue({ returning: mockReturningUpdated }) });
      mockInsertValues.mockReturnValueOnce(Promise.resolve());

      const result = await service.updateTask(mockUserId, 1, {
        title: 'Updated Title',
        priority: 'High',
      });

      expect(result).toEqual(updatedTask);
    });

    it('should return undefined if task to update does not exist', async () => {
      mockWhere.mockResolvedValueOnce([]);

      const result = await service.updateTask(mockUserId, 999, { title: 'Does not exist' });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteTask', () => {
    it('should delete task and update order for remaining tasks', async () => {
      const existingTask = mockTasks[0];

      mockWhere.mockResolvedValueOnce([existingTask]);
      mockDeleteWhere.mockResolvedValueOnce(true);
      mockUpdateSet.mockReturnValueOnce({ where: vi.fn().mockResolvedValue(true) });

      const result = await service.deleteTask(1);

      expect(result).toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(schema.tasks);
      expect(mockUpdate).toHaveBeenCalledWith(schema.tasks);
      expect(mockUpdateSet).toHaveBeenCalled();
      expect(mockDB.transaction).toHaveBeenCalled();
    });

    it('should return false if task to delete is not found', async () => {
      mockWhere.mockReturnValueOnce([]);

      const result = await service.deleteTask(999);

      expect(result).toBe(false);
    });
  });
});
