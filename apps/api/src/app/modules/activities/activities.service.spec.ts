import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivitiesService } from './activities.service';
import { DRIZZLE } from '../../db/db.module';
import { Activity } from '@todo-workspace/tasks';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockDB = {
    query: {
      activities: {
        findMany: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: DRIZZLE,
          useValue: mockDB,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActivitiesForTask', () => {
    it('should return an array of activities for the specific taskId', async () => {
      const mockTaskId = 101;
      const expectedActivities: Activity[] = [
        {
          id: 1,
          taskId: mockTaskId,
          userId: 42,
          action: 'created',
          details: 'created a new task',
          createdAt: new Date().toISOString(),
          user: {
            name: 'Mike',
          }
        },
      ];

      mockDB.query.activities.findMany.mockResolvedValue(expectedActivities);

      const result = await service.getActivitiesForTask(mockTaskId);
      expect(result).toEqual(expectedActivities);
      expect(mockDB.query.activities.findMany).toHaveBeenCalledWith({
        where: eq(schema.activities.taskId, mockTaskId),
        orderBy: expect.any(Function),
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });
  });

});
