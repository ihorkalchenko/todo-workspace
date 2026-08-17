import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Task } from '@todo-workspace/tasks';
import { CommentComponent } from './comment/comment';
import { CommentsService } from '../../../../core/comments/comments.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-comments',
  imports: [CommentComponent],
  templateUrl: './comments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CommentsComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly authService = inject(AuthService);

  readonly task = input.required<Task | null | undefined>();

  readonly newCommentText = signal('');

  readonly comments = this.commentsService.comments;
  readonly isLoading = this.commentsService.isLoading;
  readonly currentUser = this.authService.user;

  constructor() {
    effect(() => {
      const task = this.task();

      if (task) {
        this.commentsService.loadComments(task.id);
      } else {
        this.commentsService.clearComments();
      }
    });
  }

  postComment() {
    const text = this.newCommentText().trim();
    const task = this.task();

    if (!text || !task) return;

    this.commentsService
      .addComment(task.id, text)
      .subscribe(() => this.newCommentText.set(''));
  }
}
