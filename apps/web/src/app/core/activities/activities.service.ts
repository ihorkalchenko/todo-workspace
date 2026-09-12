import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Activity } from '@todo-workspace/tasks';
import { ActivitiesDataService } from './activities-data.service';

export interface ActivitiesState {
  activities: Activity[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: ActivitiesState = {
  activities: [],
  isLoading: false,
  page: 1,
  hasMore: false,
  total: 0,
};

export const ActivitiesService = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, dataService = inject(ActivitiesDataService)) => ({

    loadActivities(taskId: number, page = 1) {
      patchState(store, { isLoading: true });

      dataService.getActivities(taskId, page, 5).subscribe({
        next: (response) => {
          patchState(store, {
            activities: page === 1 ? response.data : [...store.activities(), ...response.data],
            isLoading: false,
            page: response.page,
            hasMore: response.hasMore,
            total: response.total,
          });
        },
        error: () => patchState(store, { isLoading: false }),
      })
    },

    clearActivities() {
      patchState(store, { activities: [], isLoading: false });
    },
  }))
);
