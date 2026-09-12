import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivitiesService } from './activities.service';
import { DRIZZLE } from '../../db/db.module';
import { Activity } from '@todo-workspace/tasks';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  const mockDB = {
    query: {
      activities: {
        findMany: vi.fn(),
      },
    },
    select: mockSelect,
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
    const mockTaskId = 101;
    const mockActivities: Activity[] = [
      {
        id: 1,
        taskId: mockTaskId,
        userId: 42,
        action: 'created',
        details: 'created a new task',
        createdAt: new Date().toISOString(),
        user: { name: 'Mike' },
      },
    ];

    it('should return paginated activities with default page 1 and limit 5', async () => {
      mockDB.query.activities.findMany.mockResolvedValue(mockActivities);
      mockWhere.mockResolvedValue([{ count: 15 }]);

      const result = await service.getActivitiesForTask(mockTaskId);

      expect(result).toEqual({
        data: mockActivities,
        total: 15,
        page: 1,
        limit: 5,
        hasMore: true,
      });

      expect(mockDB.query.activities.findMany).toHaveBeenCalledWith({
        where: eq(schema.activities.taskId, mockTaskId),
        orderBy: expect.any(Function),
        limit: 5,
        offset: 0,
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });

    it('should calculate hasMore = false when on the last page', async () => {
      mockDB.query.activities.findMany.mockResolvedValue(mockActivities);
      mockWhere.mockResolvedValue([{ count: 1 }]);

      const result = await service.getActivitiesForTask(mockTaskId, 1, 5);

      expect(result.hasMore).toBe(false);
    });

    it('should correctly calculate offset for custom page and limit', async () => {
      mockDB.query.activities.findMany.mockResolvedValue(mockActivities);
      mockWhere.mockResolvedValue([{ count: 25 }]);

      const result = await service.getActivitiesForTask(mockTaskId, 2, 5);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockDB.query.activities.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
        })
      );
    });

    it('should return empty data array when no activities exist', async () => {
      mockDB.query.activities.findMany.mockResolvedValue([]);
      mockWhere.mockResolvedValue([{  count: 0 }]);

      const result = await service.getActivitiesForTask(mockTaskId);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        hasMore: false,
      });
    });

  });
});
