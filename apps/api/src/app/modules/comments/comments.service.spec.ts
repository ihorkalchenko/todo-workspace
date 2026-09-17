import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from "@nestjs/common";
import { DRIZZLE } from '../../db/db.module';
import { and, eq, isNull } from 'drizzle-orm';
import * as schema from '../../db/schemas';

import { Comment } from '@todo-workspace/tasks';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockTransaction = vi.fn((cb) => cb(mockDB));

  const mockDB = {
    query: {
      comments: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    transaction: mockTransaction,
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
        parentId: null,
        content: 'Top-level comment',
        createdAt: new Date().toISOString(),
        user: { name: 'Alice' },
        replies: [
          {
            id: 2,
            taskId: mockTaskId,
            userId: 43,
            parentId: 1,
            content: 'Reply comment',
            createdAt: new Date().toISOString(),
            user: { name: 'Bob' },
          },
        ],
      },
    ];

    it('should return paginated top-level comments with nested replies', async () => {
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
        where: and(
          eq(schema.comments.taskId, mockTaskId),
          isNull(schema.comments.parentId)
        ),
        orderBy: expect.any(Function),
        limit: 5,
        offset: 0,
        with: {
          user: {
            columns: {  name: true },
          },
          replies: {
            with: {
              user: {
                columns: { name: true },
              },
            },
            orderBy: expect.any(Function),
          },
        },
      });
    });
  });

  describe('createComment', () => {
    const mockTaskId = 101;
    const mockUserId = 42;

    it('should create a top-level comment', async () => {
      const mockCreatedComment: Comment = {
        id: 1,
        taskId: mockTaskId,
        userId: mockUserId,
        parentId: null,
        content: 'New Comment',
        createdAt: new Date().toISOString(),
        user: { name: 'Alice' },
      };

      const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
      mockInsertValues
        .mockReturnValueOnce({ returning: returningMock })
        .mockResolvedValueOnce([]);

      mockDB.query.comments.findFirst.mockResolvedValue(mockCreatedComment);

      const result = await service.createComment(mockTaskId, mockUserId, 'New Comment');

      expect(result).toEqual(mockCreatedComment);
      expect(mockDB.query.comments.findFirst).toHaveBeenCalledWith({
        where: eq(schema.comments.id, 1),
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });

    it('should create a reply comment when parentId is passed', async () => {
      const mockParentComment = {
        id: 1,
        taskId: mockTaskId,
      };
      const mockReplyComment: Comment = {
        id: 2,
        taskId: mockTaskId,
        userId: mockUserId,
        parentId: 1,
        content: 'Nested reply',
        createdAt: new Date().toISOString(),
        user: { name: 'Alice' },
      };

      mockDB.query.comments.findFirst
        .mockResolvedValueOnce(mockParentComment)
        .mockResolvedValueOnce(mockReplyComment);

      const returningMock = vi.fn().mockResolvedValue([{ id: 2 }]);
      mockInsertValues
        .mockReturnValueOnce({ returning: returningMock })
        .mockResolvedValueOnce([]);

      mockDB.query.comments.findFirst.mockResolvedValue(mockReplyComment);

      const result = await service.createComment(mockTaskId, mockUserId, 'Nested reply', 1);

      expect(result).toEqual(mockReplyComment);
      expect(result.parentId).toBe(1);
      expect(mockDB.query.comments.findFirst).toHaveBeenCalledWith({
        where: and(
          eq(schema.comments.id, 1),
          eq(schema.comments.taskId, mockTaskId)
        ),
      });
    });

    it('should throw BadRequestException if parentId does not exist for the task', async () => {
      mockDB.query.comments.findFirst.mockResolvedValueOnce(null);


      await expect(
      service.createComment(mockTaskId, mockUserId, 'Invalid reply', 999)
    ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteComment', () => {
    const mockCommentId = 5;
    const mockUserId = 42;

    it('should delete comment and record activity if comment exists and belongs to user', async () => {
      const mockComment = {
        id: mockCommentId,
        taskId: 101,
        userId: mockUserId,
        content: 'To be deleted',
      };

      mockWhere.mockResolvedValue([mockComment]);
      mockDeleteWhere.mockResolvedValue([]);
      mockInsertValues.mockResolvedValue([]);

      const result = await service.deleteComment(mockCommentId, mockUserId);

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(schema.comments);
      expect(mockDeleteWhere).toHaveBeenCalledWith(eq(schema.comments.id, mockCommentId));
    });

    it('should return false if comment does not exist or does not belong to user', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.deleteComment(mockCommentId, mockUserId);

      expect(result).toBe(false);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
