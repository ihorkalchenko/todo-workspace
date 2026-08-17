import { inject, Injectable, signal } from '@angular/core';
import { CommentsDataService } from './comments-data.service';
import { Comment } from '@todo-workspace/tasks';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly commentsDataService = inject(CommentsDataService);

  private readonly _comments = signal<Comment[]>([]);

  readonly comments = this._comments.asReadonly();
  readonly isLoading = signal(false);

  loadComments(taskId: number) {
    this.isLoading.set(true);
    this.commentsDataService.getComments(taskId).subscribe({
      next: (comments) => {
        this._comments.set(comments);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  addComment(taskId: number, content: string) {
    return this.commentsDataService.createComment(taskId, content).pipe(
      tap((newComment) => {
        this._comments.update(curr => [...curr, newComment]);
      }),
    );
  }

  deleteComment(taskId: number, commentId: number) {
    return this.commentsDataService.deleteComment(taskId, commentId).pipe(
      tap(() => {
        this._comments.update(curr => curr.filter((c) => c.id !== commentId));
      }),
    );
  }

  clearComments() {
    this._comments.set([]);
  }
}
