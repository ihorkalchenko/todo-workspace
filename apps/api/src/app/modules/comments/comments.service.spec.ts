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
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
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
    update: mockUpdate,
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
    const mockTaskId = 101;

    it('should build recursive tree for comments and paginate top-level comments', async () => {
      const mockTotal = 2;
      const paginatedTopComments = [{ id: 1 }];
      const flatComments: any[] = [
        {
          id: 1,
          taskId: mockTaskId,
          parentId: null,
          content: 'Top-level 1',
          created: '2026-08-24',
          user: { name: 'Alice' },
        },
        {
          id: 2,
          taskId: mockTaskId,
          parentId: 1,
          content: 'Reply to 1',
          created: '2026-08-25',
          user: { name: 'Bob' },
        },
        {
          id: 3,
          taskId: mockTaskId,
          parentId: 2,
          content: 'Reply to Reply 1',
          created: '2026-08-26',
          user: { name: 'Charlie' },
        },
        {
          id: 4,
          taskId: mockTaskId,
          parentId: null,
          content: 'Top-level 2',
          created: '2026-08-27',
          user: { name: 'Dave' },
        },
      ];

      mockWhere.mockResolvedValue([{ count: mockTotal }]);

      mockDB.query.comments.findMany
        .mockResolvedValueOnce(paginatedTopComments)
        .mockResolvedValueOnce(flatComments);

      const result = await service.getCommentsForTask(mockTaskId, 1, 1);

      expect(result.total).toBe(2);
      expect(result.data.length).toBe(1);
      expect(result.hasMore).toBe(true);
      expect(result.data[0].id).toBe(1);

      expect(result.data[0].replies?.[0].id).toBe(2);
      expect(result.data[0].replies?.[0].replies?.[0].id).toBe(3);

      expect(mockDB.query.comments.findMany).toHaveBeenNthCalledWith(1, {
        where: and(
          eq(schema.comments.taskId, mockTaskId),
          isNull(schema.comments.parentId)
        ),
        orderBy: expect.any(Function),
        limit: 1,
        offset: 0,
        columns: { id: true },
      });

      expect(mockDB.query.comments.findMany).toHaveBeenNthCalledWith(2, {
        where: eq(schema.comments.taskId, mockTaskId),
        orderBy: expect.any(Function),
        with: {
          user: {
            columns: { name: true },
          },
        },
      });
    });

    it('should return empty result if no top-level comments exist', async () => {
      mockWhere.mockResolvedValue([{ count: 0 }]);

      const result = await service.getCommentsForTask(mockTaskId, 1, 5);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        hasMore: false,
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
        updatedAt: null,
        user: { name: 'Alice' },
      };

      const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
      mockInsertValues.mockReturnValueOnce({ returning: returningMock }).mockResolvedValueOnce([]);

      mockDB.query.comments.findFirst.mockResolvedValue(mockCreatedComment);

      const result = await service.createComment(mockTaskId, mockUserId, 'New Comment');

      expect(result).toEqual(mockCreatedComment);
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
        updatedAt: null,
        user: { name: 'Alice' },
      };

      mockDB.query.comments.findFirst
        .mockResolvedValueOnce(mockParentComment)
        .mockResolvedValueOnce(mockReplyComment);

      const returningMock = vi.fn().mockResolvedValue([{ id: 2 }]);
      mockInsertValues
        .mockReturnValueOnce({ returning: returningMock })
        .mockResolvedValueOnce([]);

      const result = await service.createComment(mockTaskId, mockUserId, 'Nested reply', 1);

      expect(result).toEqual(mockReplyComment);
      expect(result.parentId).toBe(1);
    });

    it('should throw BadRequestException if parentId does not exist for the task', async () => {
      mockDB.query.comments.findFirst.mockResolvedValueOnce(null);

      await expect(
      service.createComment(mockTaskId, mockUserId, 'Invalid reply', 999)
    ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateComment', () => {
    const mockCommentId = 5;
    const mockUserId = 42;
    const mockTaskId = 101;
    const updatedContent = 'Updated content';

    it('should update comment, record activity and return updated comment if comment exists and belong to user', async () => {
      const mockComment = {
        id: mockCommentId,
        taskId: mockTaskId,
        userId: mockUserId,
        content: 'Original content',
      };
      const mockUpdatedComment: Comment = {
        id: mockCommentId,
        taskId: mockTaskId,
        userId: mockUserId,
        parentId: null,
        content: updatedContent,
        createdAt: '2026-08-24',
        updatedAt: '2026-08-25',
        user: { name: 'Alice' },
      };

      mockWhere.mockResolvedValue([mockComment]);
      mockUpdateWhere.mockResolvedValue([]);
      mockInsertValues.mockResolvedValue([]);
      mockDB.query.comments.findFirst.mockResolvedValue(mockUpdatedComment);

      const result = await service.updateComment(mockCommentId, mockUserId, updatedContent);

      expect(result).toEqual(mockUpdatedComment);
      expect(mockUpdate).toHaveBeenCalledWith(schema.comments);
      expect(mockUpdateSet).toHaveBeenCalledWith({ content: updatedContent, updatedAt: expect.anything() });
    });

    it('should return undefined if comment does not exist or does not belong to user', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.updateComment(mockCommentId, mockUserId, updatedContent);

      expect(result).toBeUndefined();
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
    });

    it('should return false if comment does not exist or does not belong to user', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.deleteComment(mockCommentId, mockUserId);

      expect(result).toBe(false);
    });
  });
});
