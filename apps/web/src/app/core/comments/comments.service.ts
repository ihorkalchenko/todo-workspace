import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { tap } from 'rxjs';

import { Comment } from '@todo-workspace/tasks';
import { CommentsDataService } from './comments-data.service';

export interface CommentsState {
  comments: Comment[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: CommentsState = {
  comments: [],
  isLoading: false,
  page: 1,
  hasMore: false,
  total: 0,
};

export const CommentsService = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, dataService = inject(CommentsDataService)) => ({
    loadComments(taskId: number, page = 1) {
      patchState(store, { isLoading: true });

      dataService.getComments(taskId, page, 5).subscribe({
        next: (response) => {
          patchState(store, {
            comments: page === 1 ? response.data : [...store.comments(), ...response.data],
            isLoading: false,
            page: response.page,
            hasMore: response.hasMore,
            total: response.total,
          });
        },
        error: () => patchState(store, { isLoading: false }),
      });
    },

    addComment(taskId: number, content: string) {
      return dataService.createComment(taskId, content).pipe(
        tap((newComment) => {
          patchState(store, {
            comments: [...store.comments(), newComment],
            total: store.total() + 1,
          });
        })
      );
    },

    deleteComment(taskId: number, commentId: number) {
      return dataService.deleteComment(taskId, commentId).pipe(
        tap(() => {
          patchState(store, {
            comments: store.comments().filter((c) => c.id !== commentId),
            total: Math.max(0, store.total() - 1),
          });
        })
      );
    },

    clearComments() {
      patchState(store, initialState);
    },
  }))
);
