import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { CreateTagDto, Tag } from '@todo-workspace/tasks';
import { TagsDataService } from './tags-data.service';
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
          tap({
            next: newTag => {
              patchState(store, { tags: [...store.tags(), newTag] });
              notificationService.success('Tag created successfully');
            },
            error: () => notificationService.error('Failed to create tag'),
          }),
        );
      },

      deleteTag(tagId: number) {
        return tagsDataService.deleteTag(tagId).pipe(
          tap({
            next: () => {
              patchState(store, { tags: store.tags().filter(t => t.id !== tagId) });
              notificationService.success('Tag deleted successfully');
            },
            error: () => notificationService.error('Failed to delete tag'),
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
