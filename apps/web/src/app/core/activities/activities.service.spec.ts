import { describe, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ActivitiesService } from './activities.service';
import { ActivitiesDataService } from './activities-data.service';
import { Activity, PaginatedActivities } from '@todo-workspace/tasks';

describe('ActivitiesService', () => {
  let service: InstanceType<typeof ActivitiesService>;
  let mockDataService: {
    getActivities: ReturnType<typeof vi.fn>;
  };

  const mockTaskId = 101;

  const mockActivity1: Activity = {
    id: 1,
    taskId: mockTaskId,
    userId: 5,
    action: 'created task',
    details: 'Created task "New feature"',
    createdAt: '2026-09-14T12:00:00Z',
    user: { name: 'Alice' },
  };

  const mockActivity2: Activity = {
    id: 2,
    taskId: mockTaskId,
    userId: 6,
    action: 'updated status',
    details: 'Changed status to In Progress',
    createdAt: '2026-09-14T12:10:00Z',
    user: { name: 'Mike' },
  };

  const mockPaginatedResponse: PaginatedActivities = {
    data: [mockActivity1],
    total: 2,
    page: 1,
    limit: 5,
    hasMore: true,
  };

  beforeEach(() => {
    mockDataService = {
      getActivities: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ActivitiesDataService, useValue: mockDataService }],
    });

    service = TestBed.inject(ActivitiesService);
  });

  it('should initialize with default state', () => {
    expect(service.activities()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.page()).toBe(1);
    expect(service.hasMore()).toBe(false);
    expect(service.total()).toBe(0);
  });

  describe('loadActivities', () => {
    it('should load initial page (1) and update store state', () => {
      service.loadActivities(mockTaskId, 1);

      expect(mockDataService.getActivities).toHaveBeenCalledWith(mockTaskId, 1, 5);
      expect(service.activities()).toEqual([mockActivity1]);
      expect(service.total()).toBe(2);
      expect(service.page()).toBe(1);
      expect(service.hasMore()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should append items when loading extra pages (2, 3, etc.)', () => {
      service.loadActivities(mockTaskId, 1);

      const page2Response: PaginatedActivities = {
        data: [mockActivity2],
        total: 2,
        page: 2,
        limit: 5,
        hasMore: false,
      };

      mockDataService.getActivities.mockReturnValueOnce(of(page2Response));

      service.loadActivities(mockTaskId, 2);

      expect(mockDataService.getActivities).toHaveBeenCalledWith(mockTaskId, 2, 5);
      expect(service.activities()).toEqual([mockActivity1, mockActivity2]);
      expect(service.page()).toBe(2);
      expect(service.hasMore()).toBe(false);
      expect(service.isLoading()).toBe(false);
    });

    it('should set isLoading to false on API error', () => {
      mockDataService.getActivities.mockReturnValueOnce(throwError(() => new Error('Error')));

      service.loadActivities(mockTaskId, 1);

      expect(service.isLoading()).toBe(false);
      expect(service.activities()).toEqual([]);
    });
  });

  describe('clearActivities', () => {
    it('should reset activities and isLoading state', () => {
      service.loadActivities(mockTaskId, 1);
      expect(service.activities().length).toBe(1);

      service.clearActivities();

      expect(service.activities()).toEqual([]);
      expect(service.isLoading()).toBe(false);
    });
  });
});
