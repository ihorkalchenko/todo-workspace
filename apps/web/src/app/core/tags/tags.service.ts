import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { catchError, EMPTY, tap } from 'rxjs';

import { CreateTagDto, Tag } from '@todo-workspace/tasks';
import { TagsDataService } from './tags-data.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationService } from '../../shared/notification/notification.service';

export interface TagsState {
  tags: Tag[];
  isLoading: boolean;
}

const initialState: TagsState = {
  tags: [],
  isLoading: false,
};

export const TagsService = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      tagsDataService = inject(TagsDataService),
      tasksService = inject(TasksService),
      notificationService = inject(NotificationService),
    ) => ({

      loadTags() {
        patchState(store, { isLoading: true });

        tagsDataService.getTags().subscribe({
          next: (tags) => patchState(store, { tags, isLoading: false }),
          error: () => {
            patchState(store, { isLoading: false });
            notificationService.error('Failed to load tags');
          },
        });
      },

      createTag(dto: CreateTagDto) {
        return tagsDataService.createTag(dto).pipe(
          tap((newTag) => {
            patchState(store, { tags: [...store.tags(), newTag] });
            notificationService.success('Tag created successfully');
          }),
          catchError(() => {
            notificationService.error('Failed to create tag');
            return EMPTY;
          }),
        );
      },

      deleteTag(tagId: number) {
        return tagsDataService.deleteTag(tagId).pipe(
          tap(() => {
            patchState(store, { tags: store.tags().filter((t) => t.id !== tagId) });
            tasksService.removeTagFromTasks(tagId);
            notificationService.success('Tag deleted successfully');
          }),
          catchError(() => {
            notificationService.error('Failed to delete tag');
            return EMPTY;
          }),
        );
      },

    }),
  ),
  withHooks({
    onInit(store) {
      store.loadTags();
    },
  }),
);
