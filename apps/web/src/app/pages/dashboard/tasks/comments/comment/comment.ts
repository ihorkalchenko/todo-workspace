import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { User } from '@todo-workspace/users';
import { Comment, Task } from '@todo-workspace/tasks';
import { CommentsService } from '../../../../../core/comments/comments.service';
import { ConfirmDialogService } from '../../../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-comment',
  imports: [DatePipe, FormsModule],
  templateUrl: './comment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block bg-gray-50 mb-2 p-3 rounded-sm border border-gray-100',
  },
})
export class CommentComponent {
  private readonly commentsService = inject(CommentsService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly task = input.required<Task | null | undefined>();
  readonly comment = input.required<Comment>();
  readonly currentUser = input.required<User | null>();

  readonly isReplying = signal(false);
  readonly replyText = signal('');

  toggleReply() {
    this.isReplying.update((state) => !state);
  }

  postReply() {
    const text = this.replyText().trim();
    const task = this.task();
    const currComment = this.comment();

    if (!text || !task) return;

    this.commentsService
      .addComment(task.id, text, currComment.id)
      .subscribe(() => {
        this.replyText.set('');
        this.isReplying.set(false);
      });
  }

  async deleteComment(commentId: number) {
    const task = this.task();

    if (!task) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Delete Comment',
      message: `Are you sure you want to delete comment?`,
    });

    if (confirmed) {
      this.commentsService.deleteComment(task.id, commentId).subscribe();
    }
  }
}
