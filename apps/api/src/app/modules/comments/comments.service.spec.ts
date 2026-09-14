import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../../db/db.module';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

import { Comment } from '@todo-workspace/tasks';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  const mockDB = {
    query: {
      comments: {
        findMany: vi.fn(),
      },
    },
    select: mockSelect,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: DRIZZLE,
          useValue: mockDB,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCommentsForTask', () => {
    const mockTotal = 10;
    const mockTaskId = 101;
    const mockComments: Comment[] = [
      {
        id: 1,
        taskId: mockTaskId,
        userId: 42,
        content: 'Test comment',
        createdAt: new Date().toISOString(),
        user: { name: 'Alice' },
      },
    ];

    it('should return paginated comments with default page 1 and limit 5', async () => {
      mockDB.query.comments.findMany.mockResolvedValue(mockComments);
      mockWhere.mockResolvedValue([{ count: mockTotal }]);

      const result = await service.getCommentsForTask(mockTaskId);

      expect(result).toEqual({
        data: mockComments,
        total: mockTotal,
        page: 1,
        limit: 5,
        hasMore: true,
      });

      expect(mockDB.query.comments.findMany).toHaveBeenCalledWith({
        where: eq(schema.comments.taskId, mockTaskId),
        orderBy: expect.any(Function),
        limit: 5,
        offset: 0,
        with: {
          user: {
            columns: {  name: true },
          },
        },
      });

    });
  });
});
