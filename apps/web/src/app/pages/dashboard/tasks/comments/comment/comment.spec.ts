import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { User } from '@todo-workspace/users';
import { Comment, Task } from '@todo-workspace/tasks';
import { CommentComponent } from './comment';
import { CommentsService } from '../../../../../core/comments/comments.service';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/confirm-dialog.service';

describe('CommentComponent', () => {
  let component: CommentComponent;
  let fixture: ComponentFixture<CommentComponent>;
  let mockCommentsService: { deleteComment: Mock, addComment: Mock };
  let mockConfirmDialogService: { confirm: Mock };

  const mockUser: User = {
    id: 1,
    name: 'John',
    email: 'john@example.com',
    avatar: null,
  };

  const mockComment: Comment = {
    id: 101,
    taskId: 42,
    userId: 1,
    content: 'test comment',
    createdAt: new Date('2026-08-17T12:00:00Z').toISOString(),
    user: {
      name: 'John',
    },
    replies: [],
  };

  const mockTask: Task = {
    id: 42,
    title: 'Test Task',
    description: 'Testing task description',
    createdAt: new Date().toISOString(),
    status: 'To Do',
    priority: 'Medium',
    userId: 1,
    order: 0,
  };

  beforeEach(async () => {
    mockCommentsService = {
      deleteComment: vi.fn().mockReturnValue(of({ success: true })),
      addComment: vi.fn().mockReturnValue(of({})),
    };

    mockConfirmDialogService = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [CommentComponent],
      providers: [
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Render details', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', mockTask);
      fixture.componentRef.setInput('comment', mockComment);
      fixture.componentRef.setInput('currentUser', mockUser);
      fixture.detectChanges();
    });

    it('should display the username and comment content', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const authorText = compiled.querySelector('span.text-xs.font-bold')?.textContent;
      expect(authorText?.trim()).toBe('John');

      const contentText = compiled.querySelector('p.text-sm')?.textContent;
      expect(contentText?.trim()).toBe('test comment');
    });

    it('should display "Unknown" if user name is missing', () => {
      const noUserComment: Comment = {
        ...mockComment,
        user: undefined,
      };

      fixture.componentRef.setInput('comment', noUserComment);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const authorText = compiled.querySelector('span.text-xs.font-bold')?.textContent;
      expect(authorText?.trim()).toBe('Unknown');
    });
  });

  describe('Reply functionality', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', mockTask);
      fixture.componentRef.setInput('comment', mockComment);
      fixture.componentRef.setInput('currentUser', mockUser);
      fixture.detectChanges();
    });

    it('should toggle isReplying signal state', () => {
      expect(component.isReplying()).toBe(false);
      component.toggleReply();
      expect(component.isReplying()).toBe(true);
      component.toggleReply();
      expect(component.isReplying()).toBe(false);
    });

    it('should post a reply when reply text is not empty', () => {
      component.toggleReply();
      component.replyText.set('Nested reply text');

      component.postReply();

      expect(mockCommentsService.addComment).toHaveBeenCalledWith(mockTask.id, 'Nested reply text', mockComment.id);
      expect(component.replyText()).toBe('');
      expect(component.isReplying()).toBe(false);
    });

    it('should not post a reply if reply text is empty or whitespace', () => {
      component.toggleReply();
      component.replyText.set('  ');

      component.postReply();
      expect(mockCommentsService.addComment).not.toHaveBeenCalled();
    });
  });

  describe('Nested replies rendering', () => {
    it('should recursively render nested child comments', () => {
      const commentWithReplies: Comment = {
        ...mockComment,
        replies: [
          {
            id: 102,
            taskId: 42,
            userId: 2,
            parentId: 2,
            content: 'Child reply content',
            createdAt: new Date().toISOString(),
            user: { name: 'Bob' },
          },
        ],
      };

      fixture.componentRef.setInput('task', mockTask);
      fixture.componentRef.setInput('comment', commentWithReplies);
      fixture.componentRef.setInput('currentUser', mockUser);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const childCommentEls = compiled.querySelectorAll('app-comment');
      expect(childCommentEls.length).toBe(1);
    });
  });

  describe('Delete actions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('task', mockTask);
      fixture.componentRef.setInput('comment', mockComment);
      fixture.componentRef.setInput('currentUser', mockUser);
      fixture.detectChanges();
    });

    it('should call confirm dialog and delete comment if confirmed', async () => {
      mockConfirmDialogService.confirm.mockResolvedValue(true);

      await component.deleteComment(mockComment.id);
      expect(mockConfirmDialogService.confirm).toHaveBeenCalledWith({
        title: 'Delete Comment',
        message: 'Are you sure you want to delete comment?',
      });
      expect(mockCommentsService.deleteComment).toHaveBeenCalledWith(mockTask.id, mockComment.id);
    });

    it('should not delete the comment if confirm dialog is canceled', async () => {
      mockConfirmDialogService.confirm.mockResolvedValue(false);

      await component.deleteComment(mockComment.id);
      expect(mockConfirmDialogService.confirm).toHaveBeenCalled();
      expect(mockCommentsService.deleteComment).not.toHaveBeenCalled();
    });

    it('should do nothing if task input is null/missing', async () => {
      fixture.componentRef.setInput('task', null);
      fixture.detectChanges();

      await component.deleteComment(mockComment.id);
      expect(mockConfirmDialogService.confirm).not.toHaveBeenCalled();
      expect(mockCommentsService.deleteComment).not.toHaveBeenCalled();
    });
  });
});
