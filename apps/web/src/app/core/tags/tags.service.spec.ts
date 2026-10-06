import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Tag } from '@todo-workspace/tasks';
import { TagsService } from './tags.service';
import { TagsDataService } from './tags-data.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationService } from '../../shared/notification/notification.service';

describe('TagsService', () => {
  let service: InstanceType<typeof TagsService>;
  let mockDataService: {
    getTags: ReturnType<typeof vi.fn>;
    createTag: ReturnType<typeof vi.fn>;
    deleteTag: ReturnType<typeof vi.fn>;
  };
  let mockTasksService: {
    removeTagFromTasks: ReturnType<typeof vi.fn>;
  };
  let mockNotificationService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 42;
  const mockTags: Tag[] = [
    { id: 1, name: 'Bug', color: '#EF4444', userId: mockUserId },
    { id: 2, name: 'Feature', color: '#3B82F6', userId: mockUserId },
  ];

  beforeEach(() => {
    mockDataService = {
      getTags: vi.fn().mockReturnValue(of(mockTags)),
      createTag: vi.fn(),
      deleteTag: vi.fn(),
    };

    mockTasksService = {
      removeTagFromTasks: vi.fn(),
    };

    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TagsDataService, useValue: mockDataService },
        { provide: TasksService, useValue: mockTasksService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    });

    service = TestBed.inject(TagsService);
  });

  it('should initialize and load tags via onInit hook', () => {
    expect(mockDataService.getTags).toHaveBeenCalledTimes(1);
    expect(service.tags()).toEqual(mockTags);
    expect(service.isLoading()).toBe(false);
  });

  describe('loadTags', () => {
    it('should fetch tags and update store state', () => {
      const freshTags: Tag[] = [{ id: 3, name: 'Urgent', color: '#F59E0B', userId: mockUserId }];
      mockDataService.getTags.mockReturnValue(of(freshTags));

      service.loadTags();

      expect(service.tags()).toEqual(freshTags);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle error when loading tags fails', () => {
      mockDataService.getTags.mockReturnValue(throwError(() => new Error('Load failed')));

      service.loadTags();

      expect(service.isLoading()).toBe(false);
      expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to load tags');
    });
  });

  describe('createTag', () => {
    const dto = { name: 'Urgent', color: '#F59E0B' };

    it('should add new tag to state and notify on success', () => {
      const newTag: Tag = { id: 3, userId: mockUserId, ...dto };
      mockDataService.createTag.mockReturnValue(of(newTag));

      service.createTag(dto).subscribe();

      expect(mockDataService.createTag).toHaveBeenCalledWith(dto);
      expect(service.tags()).toEqual([...mockTags, newTag]);
      expect(mockNotificationService.success).toHaveBeenCalledWith('Tag created successfully');
    });

    it('should notify error, swallow it, and keep state when creation fails', () => {
      mockDataService.createTag.mockReturnValue(throwError(() => new Error('Creation failed')));
      const next = vi.fn();
      const error = vi.fn();

      service.createTag(dto).subscribe({ next, error });

      expect(next).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to create tag');
      expect(mockNotificationService.success).not.toHaveBeenCalled();
      expect(service.tags()).toEqual(mockTags);
    });
  });

  describe('deleteTag', () => {
    it('should remove tag from state, strip it from tasks, and notify on success', () => {
      mockDataService.deleteTag.mockReturnValue(of({ success: true }));

      service.deleteTag(1).subscribe();

      expect(mockDataService.deleteTag).toHaveBeenCalledWith(1);
      expect(service.tags()).toEqual([mockTags[1]]);
      expect(mockTasksService.removeTagFromTasks).toHaveBeenCalledWith(1);
      expect(mockNotificationService.success).toHaveBeenCalledWith('Tag deleted successfully');
    });

    it('should notify error, swallow it, and keep state when deletion fails', () => {
      mockDataService.deleteTag.mockReturnValue(throwError(() => new Error('Delete failed')));
      const error = vi.fn();

      service.deleteTag(1).subscribe({ error });

      expect(error).not.toHaveBeenCalled();
      expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to delete tag');
      expect(mockNotificationService.success).not.toHaveBeenCalled();
      expect(mockTasksService.removeTagFromTasks).not.toHaveBeenCalled();
      expect(service.tags()).toEqual(mockTags);
    });
  });
});
