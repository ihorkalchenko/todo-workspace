import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { computed, effect, inject } from '@angular/core';

import { TagsService } from '../../../core/tags/tags.service';
import { TasksService } from '../../../core/tasks/tasks.service';

export interface TaskFilterState {
  searchQuery: string;
  selectedTagIds: number[],
  showArchived: boolean,
}

const initialState: TaskFilterState = {
  searchQuery: '',
  selectedTagIds: [],
  showArchived: false,
};

export const TaskFilterService = signalStore(
  withState(initialState),
  withComputed(
    (
      store,
      tasksService = inject(TasksService),
      tagsService = inject(TagsService),
    ) => {
      const allTasks = computed(() => {
        const query = store.searchQuery().toLowerCase().trim();
        const selectedTagIds = store.selectedTagIds();
        const all = tasksService.tasks();

        return all.filter((task) => {
          const matchesSearch = !query || task.title.toLowerCase().includes(query);
          const matchesTags = selectedTagIds.length === 0 || task.tags?.some(t => selectedTagIds.includes(t.id));

          return matchesSearch && matchesTags;
        });
      });

      return {
        allTasks,
        availableTags: tagsService.tags,
        todoTasks: computed(() => allTasks().filter(({ status }) => status === 'To Do')),
        doingTasks: computed(() => allTasks().filter(({ status }) => status === 'Doing')),
        doneTasks: computed(() => allTasks().filter(({ status }) => status === 'Done')),
        archivedTasks: computed(() => allTasks().filter(({ status }) => status === 'Archived')),
      };
    },
  ),
  withMethods((store) => ({
    setSearchQuery(searchQuery: string){
      patchState(store, { searchQuery });
    },

    isTagSelected(tagId: number){
      return store.selectedTagIds().includes(tagId);
    },

    toggleTag(tagId: number){
      const current = store.selectedTagIds();
      const updated = current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId];

      patchState(store, { selectedTagIds: updated });
    },

    clearTagFilters() {
      patchState(store, { selectedTagIds: [] });
    },

    toggleArchived() {
      patchState(store, { showArchived: !store.showArchived() });
    },
  })),
  withHooks({
    onInit(store, tagsService = inject(TagsService)) {
      effect(() => {
        const existingIds = new Set(tagsService.tags().map((tag) => tag.id));
        const currentSelected = store.selectedTagIds();
        const pruned = currentSelected.filter((id) => existingIds.has(id));

        if (pruned.length !== currentSelected.length) {
          patchState(store, { selectedTagIds: pruned });
        }
      });
    },
  }),
);
