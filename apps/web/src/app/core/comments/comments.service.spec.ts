import { describe, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import { CommentsService } from './comments.service';
import { CommentsDataService } from './comments-data.service';
import { Comment, PaginatedComments } from '@todo-workspace/tasks';

describe('CommentsService', () => {
  let service: InstanceType<typeof CommentsService>;
  let mockDataService: {
    getComments: ReturnType<typeof vi.fn>;
    createComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  };

  const mockTaskId = 42;
  const mockComment1: Comment = {
    id: 1,
    taskId: mockTaskId,
    userId: 10,
    content: 'First comment',
    createdAt: '2026-09-14T10:00:00Z',
    user: { name: 'Alice' },
    replies: [],
  };
  const mockComment2: Comment = {
    id: 2,
    taskId: mockTaskId,
    userId: 11,
    content: 'Second comment',
    createdAt: '2026-09-14T10:05:00Z',
    user: { name: 'Mike' },
    replies: [],
  };
  const mockPaginatedResponse: PaginatedComments = {
    data: [mockComment1],
    total: 2,
    page: 1,
    limit: 5,
    hasMore: true,
  };

  beforeEach(() => {
    mockDataService = {
      getComments: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
      createComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: CommentsDataService, useValue: mockDataService }],
    });

    service = TestBed.inject(CommentsService);
  });

  it('should initialize with default state', () => {
    expect(service.comments()).toEqual([]);
    expect(service.isLoading()).toEqual(false);
    expect(service.page()).toEqual(1);
    expect(service.hasMore()).toEqual(false);
  });

  describe('loadComments', () => {
    it('should load initial page (1) and update store state', () => {
      service.loadComments(mockTaskId, 1);

      expect(mockDataService.getComments).toHaveBeenCalledWith(mockTaskId, 1, 5);
      expect(service.comments()).toEqual([mockComment1]);
      expect(service.page()).toBe(1);
      expect(service.hasMore()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should append items when loading subsequent pages (page 2)', () => {
      service.loadComments(mockTaskId, 1);

      const page2Response: PaginatedComments = {
        data: [mockComment2],
        total: 2,
        page: 2,
        limit: 5,
        hasMore: false,
      };

      mockDataService.getComments.mockReturnValueOnce(of(page2Response));

      service.loadComments(mockTaskId, 2);

      expect(mockDataService.getComments).toHaveBeenCalledWith(mockTaskId, 2, 5);
      expect(service.comments()).toEqual([mockComment1, mockComment2]);
      expect(service.page()).toBe(2);
      expect(service.hasMore()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });

    it('should set isLoading to false on API error', () => {
      mockDataService.getComments.mockReturnValueOnce(throwError(() => new Error('API Error')));

      service.loadComments(mockTaskId, 1);

      expect(service.isLoading()).toBe(false);
      expect(service.comments()).toEqual([]);
    });
  });

  describe('addComments', () => {
    it('should append newly created top-level comment and increment total count', () => {
      const newCommentContent = 'New comment';
      const newComment: Comment = {
        id: 3,
        taskId: mockTaskId,
        userId: 12,
        content: newCommentContent,
        createdAt: '2026-09-14T10:10:00Z',
        user: { name: 'Charlie' },
      };

      mockDataService.createComment.mockReturnValue(of(newComment));

      service.loadComments(mockTaskId, 1);
      expect(service.comments().length).toBe(1);

      service.addComment(mockTaskId, newCommentContent).subscribe();
      expect(mockDataService.createComment).toHaveBeenCalledWith(mockTaskId, newCommentContent, undefined);
      expect(service.comments()).toEqual([mockComment1, newComment]);
    });

    it('should insert reply comment into parent comment replies array', () => {
      const replyContent = 'Reply to comment 1';
      const replyComment: Comment = {
        id: 4,
        taskId: mockTaskId,
        userId: 13,
        parentId: mockComment1.id,
        content: replyContent,
        createdAt: '2026-09-18T10:12:00Z',
        user: { name: 'Dave' },
      };

      mockDataService.createComment.mockReturnValue(of(replyComment));

      service.loadComments(mockTaskId, 1);
      service.addComment(mockTaskId, replyContent, mockComment1.id).subscribe();

      expect(mockDataService.createComment).toHaveBeenCalledWith(mockTaskId, replyContent, mockComment1.id);

      const topComment = service.comments()[0];

      expect(topComment.replies?.length).toBe(1);
      expect(topComment.replies?.[0].id).toBe(4);
    });
  });

  describe('deleteComments', () => {
    it('should remove top-level deleted comment and decrement total count', () => {
      mockDataService.deleteComment.mockReturnValue(of({ success: true }));

      service.loadComments(mockTaskId, 1);
      expect(service.comments().length).toBe(1);

      service.deleteComment(mockTaskId, mockComment1.id).subscribe();
      expect(mockDataService.deleteComment).toHaveBeenCalledWith(mockTaskId, mockComment1.id);
      expect(service.comments()).toEqual([]);
    });

    it('should recursively remove nested child comment from parent replies array', () => {
      mockDataService.deleteComment.mockReturnValue(of({ success: true }));

      const commentWithReply: Comment = {
        ...mockComment1,
        replies: [
          {
            id: 99,
            taskId: mockTaskId,
            userId: 15,
            parentId: mockComment1.id,
            content: 'Nested child reply',
            createdAt: '2026-09-14T10:15:00Z',
            user: { name: 'Eva' },
          },
        ],
      };

      mockDataService.getComments.mockReturnValueOnce(of({
        ...mockPaginatedResponse,
        data: [commentWithReply],
      }));

      service.loadComments(mockTaskId, 1);
      expect(service.comments()[0].replies?.length).toBe(1);

      service.deleteComment(mockTaskId, 99).subscribe();

      expect(mockDataService.deleteComment).toHaveBeenCalledWith(mockTaskId, 99);
      expect(service.comments().length).toBe(1);
      expect(service.comments()[0].replies?.length).toBe(0);
    });
  });

  describe('clearComments', () => {
    it('should reset store back to initial state', () => {
      service.loadComments(mockTaskId, 1);
      expect(service.comments().length).toBe(1);

      service.clearComments();

      expect(service.comments()).toEqual([]);
      expect(service.page()).toBe(1);
      expect(service.hasMore()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });
  });
});
