import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';

import { Tag, Task } from '@todo-workspace/tasks';
import { TagsService } from '../../../core/tags/tags.service';
import { TasksService } from '../../../core/tasks/tasks.service';
import { TaskFilterService } from './task-filter.service';

describe('TaskFilterService', () => {
  let service: InstanceType<typeof TaskFilterService>;
  let mockTasks: WritableSignal<Task[]>;
  let mockTags: WritableSignal<Tag[]>;

  const initialTags: Tag[] = [
    { id: 1, name: 'Bug', color: '#EF4444', userId: 1 },
    { id: 2, name: 'Feature', color: '#3B82F6', userId: 1 },
  ];
  const initialTasks: Task[] = [
    {
      id: 1,
      title: 'Fix login issue',
      description: 'Fix login issue',
      status: 'To Do',
      priority: 'High',
      order: 0,
      createdAt: '2026-10-01T00:00:00Z',
      userId: 1,
      tags: [initialTags[0]]
    },
    {
      id: 2,
      title: 'Add dark mode',
      description: 'Add dark mode',
      status: 'Doing',
      priority: 'Medium',
      order: 1,
      createdAt: '2026-10-02T00:00:00Z',
      userId: 1,
      tags: [initialTags[1]]
    },
    {
      id: 3,
      title: 'Refactor navbar',
      description: 'Refactor navbar',
      status: 'Done',
      priority: 'Low',
      order: 2,
      createdAt: '2026-10-03T00:00:00Z',
      userId: 1,
      tags: [...initialTags],
    },
    {
      id: 4,
      title: 'Old deprecated task',
      description: 'Old deprecated task',
      status: 'Archived',
      priority: 'Low',
      order: 3,
      createdAt: '2026-10-04T00:00:00Z',
      userId: 1,
    },
  ];

  beforeEach(() => {
    mockTasks = signal<Task[]>(initialTasks);
    mockTags = signal<Tag[]>(initialTags);

    TestBed.configureTestingModule({
      providers: [
        TaskFilterService,
        { provide: TasksService, useValue: { tasks: mockTasks } },
        { provide: TagsService, useValue: { tags: mockTags } },
      ],
    });

    service = TestBed.inject(TaskFilterService);
  });

  it('should initialize with default values', () => {
    expect(service.searchQuery()).toBe('');
    expect(service.selectedTagIds()).toEqual([]);
    expect(service.showArchived()).toBe(false);
    expect(service.allTasks().length).toBe(4);
    expect(service.availableTags()).toEqual([...initialTags]);
  });

  describe('search query filtering', () => {
    it('should filter tasks by title case-insensitively and trimmed', () => {
      service.setSearchQuery('  LOGIN  ');
      expect(service.allTasks().map(t => t.id)).toEqual([1]);
    });

    it('should return all tasks when search query is empty', () => {
      service.setSearchQuery('login');
      expect(service.allTasks().length).toBe(1);

      service.setSearchQuery('');
      expect(service.allTasks().length).toBe(4);
    });
  });

  describe('tag filtering & toggling', () => {
    it('should toggle tag selection and check selection state', () => {
      expect(service.isTagSelected(1)).toBe(false);

      service.toggleTag(1);
      expect(service.isTagSelected(1)).toBe(true);
      expect(service.selectedTagIds()).toEqual([1]);

      service.toggleTag(1);
      expect(service.isTagSelected(1)).toBe(false);
      expect(service.selectedTagIds()).toEqual([]);
    });

    it('should filter tasks having at least one of the selected tags', () => {
      service.toggleTag(1);
      expect(service.allTasks().map(t => t.id)).toEqual([1, 3]);
    });

    it('should clear all selected tags', () => {
      service.toggleTag(1);
      service.toggleTag(2);
      expect(service.selectedTagIds()).toEqual([1, 2]);

      service.clearTagFilters();
      expect(service.selectedTagIds()).toEqual([]);
    });
  });

  describe('combined filters', () => {
    it('should filter filter by search query AND selected tags simultaneously', () => {
      service.toggleTag(1);
      service.setSearchQuery('navbar');

      expect(service.allTasks().length).toBe(1);
      expect(service.allTasks()[0].id).toBe(3);
    });
  });

  describe('status-based task computation', () => {
    it('should partition tasks by status', () => {
      expect(service.todoTasks().map(t => t.id)).toEqual([1]);
      expect(service.doingTasks().map(t => t.id)).toEqual([2]);
      expect(service.doneTasks().map(t => t.id)).toEqual([3]);
      expect(service.archivedTasks().map(t => t.id)).toEqual([4]);
    });
  });

  describe('hasAnyTasks', () => {
    it('should stay true when filters match nothing', () => {
      service.setSearchQuery('pfff-no-match');
      expect(service.allTasks().length).toBe(0);
      expect(service.hasAnyTasks()).toBe(true);
    });

    it('should be false when there are no tasks at all', () => {
      mockTasks.set([]);
      expect(service.hasAnyTasks()).toBe(false);
    });
  });

  describe('showArchived toggle', () => {
    it('should toggle showArchived flag', () => {
      expect(service.showArchived()).toBe(false);

      service.toggleArchived();
      expect(service.showArchived()).toBe(true);

      service.toggleArchived();
      expect(service.showArchived()).toBe(false);
    });
  });

  describe('clearFilters', () => {
    it('should reset search query and selected tags but keep showArchived', () => {
      service.setSearchQuery('login');
      service.toggleTag(1);
      service.toggleArchived();

      service.clearFilters();

      expect(service.searchQuery()).toBe('');
      expect(service.selectedTagIds()).toEqual([]);
      expect(service.showArchived()).toBe(true);
    });
  });

  describe('tag pruning OnInit effect', () => {
    it('should prune selected tag IDs when a tag is deleted from tags service', () => {
      service.toggleTag(1);
      service.toggleTag(2);
      expect(service.selectedTagIds()).toEqual([1,2]);

      mockTags.set([initialTags[1]]);
      TestBed.tick();

      expect(service.selectedTagIds()).toEqual([2]);
      expect(service.isTagSelected(1)).toBe(false);
    });
  });
});
