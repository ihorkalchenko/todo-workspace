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
}

const initialState: CommentsState = {
  comments: [],
  isLoading: false,
  page: 1,
  hasMore: false,
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
          });
        },
        error: () => patchState(store, { isLoading: false }),
      });
    },

    addComment(taskId: number, content: string, parentId?: number) {
      return dataService.createComment(taskId, content, parentId).pipe(
        tap((newComment) => {
          if (!parentId) {
            patchState(store, { comments: [...store.comments(), newComment] });
          } else {
            patchState(store, { comments: insertReplyInTree(store.comments(), newComment, parentId) });
          }
        })
      );
    },

    deleteComment(taskId: number, commentId: number) {
      return dataService.deleteComment(taskId, commentId).pipe(
        tap(() => {
          patchState(store, { comments: removeCommentFromTree(store.comments(), commentId) });
        })
      );
    },

    clearComments() {
      patchState(store, initialState);
    },
  }))
);

/**
 * Recursively inserts a new reply comment under its matching parent comment within a tree of nested comments.
 *
 * @param comments - Array of top-level/nested comments
 * @param newComment - The newly created reply comment to insert
 * @param parentId - The unique ID of the parent comment being replied to
 * @returns A new array of comments with the new reply appended to the matching parent's array
 * */
function insertReplyInTree(comments: Comment[], newComment: Comment, parentId?: number): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), newComment] };
    }

    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: insertReplyInTree(c.replies, newComment, parentId) };
    }

    return c;
  });
}

/**
 * Recursively removes a comment by its ID from a tree of nested comments.
 *
 * @param comments - Array of top-level or nested Comments
 * @param commentId - The unique ID of the comment to remove
 * @returns A new array of comments with the specified comment removed from top-level or child replies
 * */
function removeCommentFromTree(comments: Comment[], commentId: number): Comment[] {
  return comments
    .filter(c => c.id !== commentId)
    .map(c => {
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: removeCommentFromTree(c.replies, commentId) };
      }

      return c;
    });
}
